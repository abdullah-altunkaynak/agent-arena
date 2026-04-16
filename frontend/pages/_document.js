import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document({ __NEXT_DATA__ }) {
    // Get language from NEXT_DATA or default to 'en'
    // This will be overridden by individual pages
    const lang = 'en';

    return (
        <Html lang={lang}>
            <Head>
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
