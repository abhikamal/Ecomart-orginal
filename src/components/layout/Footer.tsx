const Footer = () => {
  return (
    <footer className="py-8 px-4 text-center bg-foreground/5">
      <p className="text-muted-foreground">
        &copy; {new Date().getFullYear()} EcoMart. Built for sustainable campuses 🌱
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Together we build. Together we grow
      </p>
    </footer>
  );
};

export default Footer;
