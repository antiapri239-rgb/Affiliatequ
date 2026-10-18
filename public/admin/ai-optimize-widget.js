(function () {
  var categories = [
    { value: 'cleanser', label: 'Cleanser' },
    { value: 'moisturizer', label: 'Moisturizer' },
    { value: 'sunscreen', label: 'Sunscreen' },
    { value: 'serum', label: 'Serum' },
    { value: 'masker', label: 'Masker' },
    { value: 'toner', label: 'Toner' },
    { value: 'cushion', label: 'Cushion' },
  ];

  function readValue(value, key) {
    if (value && typeof value.get === 'function') {
      var immutableValue = value.get(key);
      return typeof immutableValue === 'string' ? immutableValue : '';
    }

    var plainValue = value && value[key];
    return typeof plainValue === 'string' ? plainValue : '';
  }

  function readLegacyValue(entry, key) {
    if (!entry || typeof entry.getIn !== 'function') return '';
    var value = entry.getIn(['data', key]);
    return typeof value === 'string' ? value : '';
  }

  function getProductDetails(props) {
    var details = props.value && typeof props.value.toJS === 'function'
      ? props.value.toJS()
      : props.value;
    details = details && typeof details === 'object' && !Array.isArray(details)
      ? details
      : {};

    function getField(key) {
      if (Object.prototype.hasOwnProperty.call(details, key)) {
        return typeof details[key] === 'string' ? details[key] : '';
      }
      return readLegacyValue(props.entry, key);
    }

    return {
      title: getField('title'),
      category: getField('category'),
      description: getField('description'),
    };
  }

  function updateProductDetails(widget, key, value) {
    var details = getProductDetails(widget.props);
    widget.props.onChange(Object.assign({}, details, { [key]: value }));
  }

  function AiOptimizeFields(props) {
    var details = getProductDetails(props);

    return h(
      'div',
      { className: props.classNameWrapper },
      h(
        'label',
        { htmlFor: props.forID + '-title', style: { display: 'block', marginBottom: '12px' } },
        'Nama Produk',
        h('input', {
          id: props.forID + '-title',
          type: 'text',
          value: details.title,
          onChange: function (event) {
            updateProductDetails(props, 'title', event.target.value);
          },
          required: true,
          style: { display: 'block', width: '100%', marginTop: '4px' },
        }),
      ),
      h(
        'label',
        { htmlFor: props.forID + '-category', style: { display: 'block', marginBottom: '12px' } },
        'Kategori',
        h(
          'select',
          {
            id: props.forID + '-category',
            value: details.category,
            onChange: function (event) {
              updateProductDetails(props, 'category', event.target.value);
            },
            required: true,
            style: { display: 'block', width: '100%', marginTop: '4px' },
          },
          h('option', { value: '' }, 'Pilih kategori'),
          categories.map(function (category) {
            return h('option', { key: category.value, value: category.value }, category.label);
          }),
        ),
      ),
      h(
        'label',
        { htmlFor: props.forID + '-description', style: { display: 'block' } },
        'Deskripsi',
        h('textarea', {
          id: props.forID + '-description',
          value: details.description,
          onChange: function (event) {
            updateProductDetails(props, 'description', event.target.value);
          },
          rows: 5,
          style: { display: 'block', width: '100%', marginTop: '4px' },
        }),
      ),
      h(
        'button',
        {
          type: 'button',
          disabled: props.loading,
          onClick: props.onOptimize,
          style: {
            marginTop: '8px',
            padding: '8px 12px',
            cursor: props.loading ? 'wait' : 'pointer',
            opacity: props.loading ? 0.65 : 1,
          },
        },
        props.loading ? 'Memproses...' : '✨ Rapikan dengan AI',
      ),
      props.message
        ? h('p', { role: props.error ? 'alert' : 'status' }, props.message)
        : null,
    );
  }

  var AiOptimizeControl = createClass({
    getInitialState: function () {
      return { loading: false, message: '', error: false };
    },

    handleClick: async function () {
      var details = getProductDetails(this.props);
      var title = details.title.trim();
      var category = details.category.trim();
      var description = details.description.trim();

      if (!title || !category || !description) {
        this.setState({
          message: 'Isi nama produk, pilih kategori, dan masukkan deskripsi terlebih dahulu.',
          error: true,
        });
        return;
      }

      this.setState({ loading: true, message: '', error: false });

      try {
        var response = await fetch('/api/optimize-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            description: description,
            category: category,
          }),
        });

        var result;
        try {
          result = await response.json();
        } catch (error) {
          throw new Error('Server mengirim respons yang tidak valid.', { cause: error });
        }

        if (!response.ok) {
          throw new Error(
            typeof result.error === 'string' && result.error
              ? result.error
              : 'HTTP Error ' + response.status,
          );
        }

        if (
          typeof result.title !== 'string'
          || !result.title.trim()
          || typeof result.description !== 'string'
          || !result.description.trim()
        ) {
          throw new Error('Server tidak mengembalikan judul dan deskripsi yang valid.');
        }

        this.props.onChange(Object.assign({}, details, {
          title: result.title.trim(),
          category: category,
          description: result.description.trim(),
        }));
        this.setState({
          message: 'Judul dan deskripsi berhasil dirapikan.',
          error: false,
        });
      } catch (error) {
        var message = error instanceof Error ? error.message : String(error);
        alert('Gagal merapikan produk: ' + message);
      } finally {
        this.setState({ loading: false });
      }
    },

    render: function () {
      var props = Object.assign({}, this.props, {
        loading: this.state.loading,
        message: this.state.message,
        error: this.state.error,
        onOptimize: this.handleClick,
      });
      return h(AiOptimizeFields, props);
    },
  });

  var AiOptimizePreview = createClass({
    render: function () {
      return h('span', null, readValue(this.props.value, 'description'));
    },
  });

  CMS.registerWidget('ai_optimize', AiOptimizeControl, AiOptimizePreview, {
    type: 'object',
    properties: {
      title: { type: 'string' },
      category: {
        type: 'string',
        enum: categories.map(function (category) {
          return category.value;
        }),
      },
      description: { type: 'string' },
    },
    required: ['title', 'category'],
  });
})();
