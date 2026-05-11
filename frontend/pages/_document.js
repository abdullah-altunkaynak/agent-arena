import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document({ __NEXT_DATA__ }) {
    // Get language from NEXT_DATA or default to 'en'
    // This will be overridden by individual pages
    const lang = 'en';

    return (
        <Html lang={lang}>
            <Head>
                {/* Yandex Search Console */}
                <meta name="yandex-verification" content="71f35be062829989" />

                {/* Google AdSense */}
                <meta name="google-adsense-account" content="ca-pub-3863550667981849" />
                <Script
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3863550667981849"
                    async
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

                {/* Ahrefs Web Analytics */}
                <Script
                    src="https://analytics.ahrefs.com/analytics.js"
                    data-key="GWxSu34c73JU/nCNdPO/2Q"
                    async
                    strategy="afterInteractive"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
