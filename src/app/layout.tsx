import "./globals.css";
import "./layout.scss";
import LayoutWrapper from "./_components/LayoutWrapper";
import { Metadata } from "next";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-P7SNSPF3');`,
          }}
        />

        {/* End Google Tag Manager  */}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans&family=Poppins&family=Quicksand&display=swap"
          rel="stylesheet"
        />
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
        <LayoutWrapper>{children}</LayoutWrapper>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`,
          }}
        />
        <script
          id="zsiqscript"
          src="https://salesiq.zohopublic.in/widget?wc=siq992fbe92f9ef9a36617ac4c9babe51c3d7778f44133f1fe66ec7795c68a6c396"
          defer
        ></script>
        {/* <script
          src="https://torri.ai/embed-bot.js"
          // @ts-ignore
          chatbotid="9bfb16c7-142e-4946-9ce2-61282e64b38b"
        ></script> */}
        <script
          src="https://chatbot-ai-silk.vercel.app/embed-bot.js"
          // @ts-ignore
          chatbotID="f629716b-48f8-4a7f-a767-68c3f61dd189"
        ></script>
      </body>
    </html>
  );
}
