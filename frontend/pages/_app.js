import Head from "next/head";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Skip ThemeProvider for blog pages since they use localStorage
  const isBlogPage = router.pathname.startsWith('/blog');

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/robot-2.png" />
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/96/robot-2.png" />
      </Head>
      {isBlogPage ? (
        <Component {...pageProps} />
      ) : (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={["dark", "light"]}
        >
          <Component {...pageProps} />
        </ThemeProvider>
      )}
    </>
  );
}
