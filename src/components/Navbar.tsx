import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/Logo Written.png';

const Navbar: React.FC = () => {
  return (
    <div className='flex py-4 px-6 items-center justify-between bg-white shadow-md border-b border-gray-200'>
      <Link to="/">
        <img src={logoImage} alt="logo" className="h-10" />
      </Link>
      
      <ul className='flex gap-8 text-gray-900'>
        <li className='hover:text-purple-600 hover:font-bold transition-all cursor-pointer'>Home</li>
        <li className='hover:text-purple-600 hover:font-bold transition-all cursor-pointer'>Features</li>
        <li className='hover:text-purple-600 hover:font-bold transition-all cursor-pointer'>About us</li>
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