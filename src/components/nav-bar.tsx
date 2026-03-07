import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex gap-2 ">
      <ul>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
      </ul>
    </nav>
  );
};

export default Navbar;
