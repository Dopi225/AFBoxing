// layouts/PublicLayout.jsx
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet-async";
import AdminStaffShortcut from "../components/AdminStaffShortcut";

const PublicLayout = () => {
  return (
    <>
      <Helmet>
        <title>AF BOXING CLUB 86 — Boxe à Poitiers</title>
        <meta
          name="description"
          content="AF Boxing Club 86 — boxe et accompagnement socio-éducatif à Poitiers. Horaires, tarifs, équipe, contact."
        />
      </Helmet>
      <Navbar />
      <Outlet />
      <Footer />
      <AdminStaffShortcut />
    </>
  );
};

export default PublicLayout;
