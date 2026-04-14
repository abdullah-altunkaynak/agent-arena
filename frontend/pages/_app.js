import Head from "next/head";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import "../styles/globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-T8JJ0W8N3G";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Skip ThemeProvider for blog pages since they use localStorage
  const isBlogPage = router.pathname.startsWith('/blog');

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>

      <Head>
        <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/robot-2.png" />
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/96/robot-2.png" />
      </Head>
      {isBlogPage ? (
        <>
          <Component {...pageProps} />
          <Footer />
        </>
      ) : (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={["dark", "light"]}
        >
          <Component {...pageProps} />
          <Footer />
        </ThemeProvider>
      )}
    </>
  );
}
