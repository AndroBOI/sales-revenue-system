const NavBtn = ({ onClick, disabled, children }: {
  onClick:  () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-1"
  >
    {children}
  </button>
);

export default NavBtn;