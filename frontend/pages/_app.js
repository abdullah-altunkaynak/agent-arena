import Head from "next/head";
import { ThemeProvider } from "next-themes";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
    >
      <Head>
        <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/robot-2.png" />
        <link rel="apple-touch-icon" href="https://img.icons8.com/fluency/96/robot-2.png" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
