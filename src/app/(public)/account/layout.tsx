import { redirect } from "next/navigation";
import { auth } from "../../_helpers/server/auth";

async function Layout({ children }: { children: React.ReactNode }) {
  /// if user is logged in redirect to home page
  if (auth.isAuthenticated()) {
    redirect("/");
  }

  return <>{children}</>;
}

export default Layout;
