import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { InvitationProvider } from "@/lib/contexts/InvitationContext";
import NavMenu from "@/components/NavMenu";

export const metadata = {
  title: "CareVoice Assistant",
  description: "Your intelligent companion for healthcare documentation and assessments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <InvitationProvider>
            <NavMenu />
            <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
              {children}
            </div>
          </InvitationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
