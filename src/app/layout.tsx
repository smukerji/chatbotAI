import "./global.scss";
import LayoutWrapper from "./_components/LayoutWrapper";
import { Metadata } from "next";
import { Josefin_Sans, Quicksand, Poppins } from "next/font/google";
import Script from "next/script";

const josefinSans = Josefin_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-josefin-sans",
});
const quickSand = Quicksand({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-quick-sand",
});
const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://torri.ai"),
  title: { default: "TORRI.AI", template: `%s` },
  description:
    "Torri is the personalized custom chatbot solution. You can create your personal chatbot with specific respective data and interact with it to minimize time and effort",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager  */}
        <Script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-P7SNSPF3');`,
          }}
          id="google-tag-manager"
        />

        {/* End Google Tag Manager  */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P7SNSPF3"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript)  */}
        <LayoutWrapper>
          <main
            className={`${josefinSans.variable} ${quickSand.variable} ${poppins.variable}`}
          >
            {children}
          </main>
        </LayoutWrapper>
        <Script
          id="zsiqscript"
          dangerouslySetInnerHTML={{
            __html: `window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`,
          }}
        />
        <Script
          strategy="lazyOnload"
          id="zsiqscript"
          src="https://salesiq.zohopublic.in/widget?wc=siq992fbe92f9ef9a36617ac4c9babe51c3d7778f44133f1fe66ec7795c68a6c396"
          defer={true}
        ></Script>{" "}
        <Script
          src="https://torri.ai/embed-bot.js"
          // @ts-ignore
          chatbotid="5049369b-bbd0-49a5-84dc-c9c62b60f87e"
        ></Script>
        {/*         <Script
          src="https://ichefpos.vercel.app/embed-bot.js"
          // @ts-ignore
          chatbotID="482163e1-f1d5-4a61-9805-82185e2cf47a"
        ></Script> */}
      </body>
    </html>
  );
}
