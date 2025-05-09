import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const lastUserIdRef = useRef(null);

  // 🔁 Load/reset cart on user change
  useEffect(() => {
    if (user?.user_id && user.user_id !== lastUserIdRef.current) {
      const stored = localStorage.getItem(`cart-${user.user_id}`);
      setCart(stored ? JSON.parse(stored) : []);
      lastUserIdRef.current = user.user_id;
    } else if (!user && lastUserIdRef.current) {
      setCart([]);
      lastUserIdRef.current = null;
    }
  }, [user]);

  // 💾 Save cart to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart-${user.user_id}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  const addToCart = (product) => {
    setCart((prev) => {
      // 🚫 Block if trying to mix shops
      if (prev.length > 0 && prev[0].shop_id !== product.shop_id) {
        toast.error("You can only add products from one shop at a time.");
        return prev;
      }

      const exist = prev.find((item) => item.product_id === product.product_id);

      if (exist) {
        if (exist.cartQuantity >= exist.quantity) {
          toast.warn(
            `Only ${exist.quantity} of ${exist.name} available in stock.`
          );
          return prev;
        }

        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        if (product.quantity < 1) {
          toast.warn(`${product.name} is out of stock.`);
          return prev;
        }

        return [...prev, { ...product, cartQuantity: 1 }];
      }
    });
  };


  const removeFromCart = (productId) => {
    setCart((prev) => {
      toast.info("Item removed");
      return prev.filter((item) => item.product_id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user) localStorage.removeItem(`cart-${user.user_id}`);
    toast.warning("Cart cleared");
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, cartQuantity: quantity }
          : item
      )
    );
    toast.info("Quantity updated");
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
