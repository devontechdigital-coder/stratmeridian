import connectToDatabase from '@/lib/mongodb';
import Page from '@/models/Page';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import styles from '@/components/public/meridianTheme.module.css';

function renderHtml(model) {
  return model.editorPreference === 'raw' ? model.rawHtml : model.htmlContent;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const page = await Page.findOne({ slug, status: 'active' });

  if (!page) return {};

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
    keywords: page.metaKeywords,
  };
}

export default async function DynamicPublicPage({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const page = await Page.findOne({ slug, status: 'active' });

  if (!page) {
    notFound();
  }

  return (
    <div className={`${styles.shell} ${styles.page}`}>
      {page.customCss && (
        <style dangerouslySetInnerHTML={{ __html: page.customCss }} />
      )}

      <section className={styles.pageHero}>
        <div className={styles.wrap}>
          <div className={styles.breadcrumb}><Link href="/">Home</Link> / {page.title}</div>
          <h1>{page.title}</h1>
        </div>
      </section>

      {renderHtml(page) && (
        <div className={styles.section}>
          <div className={styles.wrap} style={{ color: "var(--text-primary)" }} dangerouslySetInnerHTML={{ __html: renderHtml(page) }} />
        </div>
      )}

      {page.customJs && (
        <Script
          id={`custom-js-${page.slug}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: page.customJs }}
        />
      )}
    </div>
  );
}
