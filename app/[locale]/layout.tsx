/**
 * @license
 * Copyright (c) 2021-present, FriendliAI Inc. All rights reserved.
 */

import { I18nProviderClient } from '@/locales/client';
import { RootProvider } from 'fumadocs-ui/provider';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;

//   if (!(languages as readonly string[]).includes(locale)) {
//     notFound();
//   }

  return (
    <I18nProviderClient locale={locale}>
      <RootProvider i18n={{ locale }}>
        {children}
      </RootProvider>
    </I18nProviderClient>
  );
}