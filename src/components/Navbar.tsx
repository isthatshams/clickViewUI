import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImage from '../assets/Logo Written.png';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const isHomePage = location.pathname === '/';
  const isFeaturesPage = location.pathname === '/features';

  return (
    <div className='flex py-4 px-6 items-center justify-between bg-white shadow-md border-b border-gray-200'>
      <Link to="/">
        <img src={logoImage} alt="logo" className="h-10" />
      </Link>
      
      <ul className='flex gap-8 text-gray-900'>
        <Link to="/">
          <li className={`transition-all cursor-pointer ${isHomePage ? 'text-purple-600 font-bold' : 'hover:text-purple-600 hover:font-bold'}`}>
            Home
          </li>
        </Link>
        <Link to="/features">
          <li className={`transition-all cursor-pointer ${isFeaturesPage ? 'text-purple-600 font-bold' : 'hover:text-purple-600 hover:font-bold'}`}>
            Features
          </li>
        </Link>
        <Link to="/about">
          <li className={`transition-all cursor-pointer ${isAboutPage ? 'text-purple-600 font-bold' : 'hover:text-purple-600 hover:font-bold'}`}>
            About us
          </li>
        </Link>
      </ul>

      <div className='flex items-center gap-4'>
        <Link to="/signin">
          <button className="px-4 py-2 rounded-md text-sm font-medium border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors">
            Sign In
          </button>
        </Link>
        <Link to="/signup">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar; 