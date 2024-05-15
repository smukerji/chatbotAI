import { Metadata } from 'next';

export function generateMetadata({
  title,
  description,
  canonical,
}: {
  title?: string;
  description?: string;
  canonical?: string;
}) {
  let metaObject: Metadata = {};
  if (title) {
    metaObject.title = title;
  }
  if (description) {
    metaObject.description = description;
  }
  if (canonical) {
    metaObject = {
      ...metaObject,
      alternates: {
        canonical: canonical,
      },
    };
  }
  return metaObject;
}
