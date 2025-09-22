'use client';

import Head from 'next/head';

export default function SearchConsoleVerification() {
  const verificationCode = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_VERIFICATION;

  if (!verificationCode) {
    return null;
  }

  return (
    <Head>
      <meta name="google-site-verification" content={verificationCode} />
    </Head>
  );
}