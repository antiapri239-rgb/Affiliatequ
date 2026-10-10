const ProductCatalogPreview = createClass({
  render() {
    const data = this.props.entry.get('data');
    const imagePath = data.get('image');
    const image = imagePath ? this.props.getAsset(imagePath).toString() : '';
    const shopeeUrl = data.get('shopeeUrl');
    const badge = data.get('badge');

    return h(
      'main',
      {
        style: {
          boxSizing: 'border-box',
          color: '#292524',
          fontFamily: 'system-ui, sans-serif',
          margin: '0 auto',
          maxWidth: '760px',
          padding: '20px',
        },
      },
      h(
        'article',
        {
          style: {
            alignItems: 'flex-start',
            background: '#fff',
            border: '1px solid #e7e5e4',
            borderRadius: '10px',
            display: 'flex',
            gap: '14px',
            padding: '12px',
          },
        },
        image &&
          h('img', {
            src: image,
            alt: data.get('title') || '',
            className: 'product-preview-image',
            style: {
              background: '#f5f5f4',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              flex: '0 0 72px',
              height: '72px',
              objectFit: 'cover',
              width: '72px',
            },
          }),
        h(
          'div',
          { style: { minWidth: '0' } },
          h('h1', { style: { fontSize: '18px', margin: '0 0 6px' } }, data.get('title') || 'Produk baru'),
          h(
            'p',
            { style: { color: '#57534e', fontSize: '12px', lineHeight: '1.6', margin: '0' } },
            h('strong', {}, 'ID: '),
            data.get('id') || '-',
            ' · ',
            h('strong', {}, 'Kategori: '),
            data.get('category') || '-',
            h('br'),
            h('strong', {}, 'Gambar: '),
            imagePath || 'Belum dipilih',
            h('br'),
            h('strong', {}, 'Link Shopee: '),
            shopeeUrl
              ? h(
                  'a',
                  { href: shopeeUrl, rel: 'noopener noreferrer', target: '_blank' },
                  shopeeUrl,
                )
              : 'Belum diisi',
            badge &&
              h(
                'span',
                {
                  style: {
                    background: '#f5f5f4',
                    borderRadius: '999px',
                    display: 'inline-block',
                    marginLeft: '8px',
                    padding: '2px 8px',
                  },
                },
                badge,
              ),
          ),
        ),
      ),
    );
  },
});

CMS.registerPreviewTemplate('products', ProductCatalogPreview);

const categoryLabels = {
  dinding: 'Dinding & Panel',
  tanaman: 'Tanaman & Pot',
  lampu: 'Lampu & Cermin',
  aksesoris: 'Aksesoris Ruang',
};

const BlogPostPreview = createClass({
  render() {
    const data = this.props.entry.get('data');
    const advanced = data.get('advanced');
    const imagePath = data.get('heroImage');
    const image = imagePath ? this.props.getAsset(imagePath).toString() : '';
    const productIds = advanced && advanced.get('productIds');
    const isDraft = data.get('draft');
    const galleryImages = advanced && advanced.get('galleryImages');
    const tags = advanced && advanced.get('tags');
    const seoTitle = advanced && advanced.get('seoTitle');
    const seoDescription = advanced && advanced.get('seoDescription');
    const publishAt = advanced && advanced.get('publishAt');
    const category = advanced && advanced.get('category');
    const isScheduled = publishAt && Date.parse(publishAt) > Date.now();
    const galleryItems = galleryImages
      ? galleryImages.toArray().map((item) => ({
          image: item.get('image'),
          alt: item.get('alt'),
          caption: item.get('caption'),
        }))
      : [];
    const tagItems = tags
      ? (typeof tags.toArray === 'function'
          ? tags.toArray()
          : Array.isArray(tags) ? tags : [])
      : [];

    return h(
      'main',
      {
        style: {
          boxSizing: 'border-box',
          color: '#292524',
          fontFamily: 'system-ui, sans-serif',
          margin: '0 auto',
          maxWidth: '760px',
          padding: '20px',
        },
      },
      h(
        'article',
        {
          style: {
            background: '#fff',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        },
        h(
          'header',
          { style: { borderBottom: '1px solid #e7e5e4', padding: '16px' } },
          h(
            'div',
            { style: { alignItems: 'flex-start', display: 'flex', gap: '14px' } },
            image &&
              h('img', {
                src: image,
                alt: data.get('title') || '',
                className: 'blog-preview-image',
                style: {
                  background: '#f5f5f4',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  flex: '0 0 112px',
                  height: '84px',
                  objectFit: 'cover',
                  width: '112px',
                },
              }),
            h(
              'div',
              { style: { minWidth: '0' } },
              h(
                'div',
                { style: { alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' } },
                h(
                  'span',
                  {
                    style: {
                      background: '#ecfdf5',
                      borderRadius: '999px',
                      color: '#047857',
                      fontSize: '11px',
                      padding: '3px 9px',
                    },
                  },
                  categoryLabels[category] || category || 'Tanpa kategori',
                ),
                h(
                  'span',
                  {
                    style: {
                      background: isDraft || isScheduled ? '#fef3c7' : '#f5f5f4',
                      borderRadius: '999px',
                      color: '#57534e',
                      fontSize: '11px',
                      padding: '3px 9px',
                    },
                  },
                  isDraft ? 'Draft' : isScheduled ? 'Terjadwal' : 'Siap terbit',
                ),
              ),
              h(
                'h1',
                { style: { fontSize: '20px', lineHeight: '1.35', margin: '0 0 6px' } },
                data.get('title') || 'Artikel baru',
              ),
              h(
                'p',
                { style: { color: '#78716c', fontSize: '12px', margin: '0' } },
                data.get('pubDate') || 'Tanggal belum diatur',
                ' · ',
                'Alfeto',
              ),
              publishAt &&
                h(
                  'p',
                  { style: { color: '#78716c', fontSize: '12px', margin: '4px 0 0' } },
                  'Jadwal: ',
                  new Date(publishAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
                  ' WIB',
                ),
            ),
          ),
          h(
            'p',
            { style: { color: '#57534e', fontSize: '14px', lineHeight: '1.6', margin: '14px 0 0' } },
            data.get('description') || 'Deskripsi artikel akan tampil di sini.',
          ),
          h(
            'section',
            {
              style: {
                background: '#f5f5f4',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: '1.6',
                marginTop: '12px',
                padding: '10px',
              },
            },
            h('strong', {}, 'Preview SEO'),
            h('div', {}, seoTitle || data.get('title') || 'Judul SEO akan tampil di sini.'),
            h(
              'div',
              { style: { color: '#57534e' } },
              seoDescription || data.get('description') || 'Deskripsi SEO akan tampil di sini.',
            ),
          ),
          tagItems.length > 0 &&
            h(
              'div',
              { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' } },
              tagItems.map((tag) =>
                h(
                  'span',
                  {
                    style: {
                      background: '#f5f5f4',
                      borderRadius: '999px',
                      color: '#57534e',
                      fontSize: '11px',
                      padding: '3px 9px',
                    },
                  },
                  tag,
                ),
              ),
            ),
          h(
            'p',
            { style: { color: '#57534e', fontSize: '12px', lineHeight: '1.6', margin: '10px 0 0' } },
            h('strong', {}, 'ID produk terkait: '),
            productIds && productIds.size > 0 ? productIds.toArray().join(', ') : 'Belum ada',
          ),
        ),
        h(
          'section',
          { className: 'blog-preview-content', style: { fontSize: '14px', lineHeight: '1.7', padding: '16px' } },
          h('h2', { style: { fontSize: '16px', margin: '0 0 10px' } }, 'Isi artikel'),
          this.props.widgetFor('body'),
        ),
        galleryItems.length > 0 &&
          h(
            'section',
            { style: { borderTop: '1px solid #e7e5e4', padding: '16px' } },
            h('h2', { style: { fontSize: '16px', margin: '0 0 10px' } }, 'Galeri gambar'),
            h(
              'div',
              { style: { display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
              galleryItems.map(({ image: galleryImage, alt, caption }) =>
                h(
                  'figure',
                  { style: { margin: '0' } },
                  galleryImage &&
                    h('img', {
                      src: this.props.getAsset(galleryImage).toString(),
                      alt: alt || '',
                      style: {
                        aspectRatio: '4 / 3',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        width: '100%',
                      },
                    }),
                  h(
                    'figcaption',
                    { style: { color: '#57534e', fontSize: '12px', marginTop: '6px' } },
                    h('div', {}, h('strong', {}, 'Alt: '), alt || 'Belum diisi'),
                    caption && h('div', {}, caption),
                  ),
                ),
              ),
            ),
          ),
      ),
    );
  },
});

CMS.registerPreviewTemplate('blog', BlogPostPreview);

CMS.registerPreviewStyle('/admin/preview.css');
