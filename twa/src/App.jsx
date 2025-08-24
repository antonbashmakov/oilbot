import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CartPage from './pages/CartPage';
import ThankYouPage from './pages/ThankYouPage';

import { UserProvider, useUser } from './context/UserContext';
import { CartProvider } from './context/CartContext';


const AppContent = () => {
  const { userId } = useUser();
  return (
    <CartProvider userId={userId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </UserProvider>
  );
};