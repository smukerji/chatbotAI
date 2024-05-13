import './globals.css';
import './layout.scss';
import LayoutWrapper from './_components/LayoutWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: 'TORRI.AI', template: `%s | TORRI.AI` },
  description:
    'Torri is the personalized custom chatbot solution. You can create your personal chatbot with specific respective data and interact with it to minimize time and effort',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
        <link
          href='https://fonts.googleapis.com/css2?family=Josefin+Sans&family=Poppins&family=Quicksand&display=swap'
          rel='stylesheet'
        />
      </head>

      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
