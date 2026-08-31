import connectToDatabase from '@/lib/mongodb';
import Category from '@/models/Category';
import Service from '@/models/Service';
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
  const category = await Category.findOne({ slug, status: 'active' });

  if (!category) return {};

  return {
    title: category.metaTitle || category.title,
    description: category.metaDescription,
    keywords: category.metaKeywords,
  };
}

export default async function PublicCategoryPage({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const category = await Category.findOne({ slug, status: 'active' }).populate('parent', 'title slug');

  if (!category) {
    notFound();
  }

  const services = await Service.find({ category: category._id, status: 'active' }).sort({ createdAt: -1 });
  const childCategories = await Category.find({ parent: category._id, status: 'active' }).sort({ createdAt: -1 });

  return (
    <div className={`${styles.shell} ${styles.page}`}>
      {category.customCss && <style dangerouslySetInnerHTML={{ __html: category.customCss }} />}

      <section
        className={styles.pageHero}
        style={{
          background: category.imageUrl
            ? `linear-gradient(120% 100% at 78% 12%, rgba(13,43,41,.86), rgba(7,28,27,.94)), url(${category.imageUrl}) center/cover`
            : undefined,
        }}
      >
        <div className={styles.wrap}>
          <div className={styles.breadcrumb}><Link href="/">Home</Link> / {category.title}</div>
          <div className={styles.heroEyebrow}>Category</div>
          <h1>{category.title}</h1>
          {category.parent && (
            <p>Parent category: <Link href={`/category/${category.parent.slug}`} style={{ color: "var(--gold)" }}>{category.parent.title}</Link></p>
          )}
        </div>
      </section>

      {renderHtml(category) && (
        <div className={styles.section}>
          <div className={styles.wrap} style={{ color: "var(--text-primary)" }} dangerouslySetInnerHTML={{ __html: renderHtml(category) }} />
        </div>
      )}

      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          {childCategories.length > 0 && (
            <>
              <div className={styles.eyebrow} style={{ marginBottom: 20 }}>Sub Categories</div>
              <div className={styles.cardGrid} style={{ marginBottom: 50 }}>
                {childCategories.map((child) => (
                  <Link href={`/category/${child.slug}`} className={styles.linkCard} key={child._id}>
                    <h5>{child.title}</h5>
                    <p>{child.metaDescription || 'Explore this category'}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className={styles.eyebrow} style={{ marginBottom: 20 }}>Services</div>
          <div className={styles.cardGrid}>
            {services.map((service) => (
              <Link href={`/service/${service.slug}`} className={styles.linkCard} key={service._id}>
                <h5>{service.title}</h5>
                <p>{service.metaDescription || 'View service details and submit documents.'}</p>
                <span className={styles.linkCardPrice}>
                  {Number(service.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </Link>
            ))}
            {services.length === 0 && childCategories.length === 0 && (
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>No services found in this category.</p>
            )}
          </div>
        </div>
      </section>

      {category.customJs && (
        <Script id={`custom-js-category-${category.slug}`} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: category.customJs }} />
      )}
    </div>
  );
}
