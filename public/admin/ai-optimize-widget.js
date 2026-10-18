(function () {
  function readEntryValue(entry, path) {
    if (!entry || typeof entry.getIn !== 'function') return '';
    var value = entry.getIn(path);
    return typeof value === 'string' ? value.trim() : '';
  }

  function findFieldControl(labelText) {
    var labels = document.querySelectorAll('label');
    var expectedLabel = labelText.trim().toLocaleLowerCase();

    for (var index = 0; index < labels.length; index += 1) {
      var label = labels[index];
      if (label.textContent.trim().toLocaleLowerCase() !== expectedLabel) continue;

      var control = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      if (!control && label.parentElement) {
        control = label.parentElement.querySelector(
          'input:not([type="hidden"]), textarea, select, [role="combobox"]',
        );
      }
      if (control) return control;
    }

    return null;
  }

  function readFieldValue(labelText) {
    var control = findFieldControl(labelText);
    return control && typeof control.value === 'string' ? control.value.trim() : '';
  }

  function updateTitleField(title) {
    var control = findFieldControl('Nama Produk');
    if (!control || !('value' in control)) {
      throw new Error('Field Nama Produk tidak ditemukan di form CMS.');
    }

    var prototype = control.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    var valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (!valueSetter) {
      throw new Error('Field Nama Produk tidak dapat diperbarui.');
    }

    valueSetter.call(control, title);
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const AiOptimizeControl = createClass({
    getInitialState: function () {
      return { loading: false, message: '' };
    },

    handleClick: async function () {
      var title =
        readEntryValue(this.props.entry, ['data', 'title'])
        || readFieldValue('Nama Produk');
      var category =
        readEntryValue(this.props.entry, ['data', 'category'])
        || readFieldValue('Kategori');
      var description = typeof this.props.value === 'string' ? this.props.value.trim() : '';

      if (!title || !category || !description) {
        alert('Isi nama produk, pilih kategori, dan masukkan deskripsi terlebih dahulu.');
        return;
      }

      this.setState({ loading: true, message: '' });

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

        updateTitleField(result.title.trim());
        this.props.onChange(result.description.trim());
        this.setState({ message: 'Judul dan deskripsi berhasil dirapikan.' });
      } catch (error) {
        var message = error instanceof Error ? error.message : String(error);
        alert('Gagal merapikan produk: ' + message);
      } finally {
        this.setState({ loading: false });
      }
    },

    render: function () {
      var description = typeof this.props.value === 'string' ? this.props.value : '';

      return h(
        'div',
        { className: this.props.classNameWrapper },
        h('textarea', {
          id: this.props.forID,
          value: description,
          onChange: (event) => this.props.onChange(event.target.value),
          rows: 5,
          style: { width: '100%' },
        }),
        h(
          'button',
          {
            type: 'button',
            disabled: this.state.loading,
            onClick: this.handleClick,
            style: {
              marginTop: '8px',
              padding: '8px 12px',
              cursor: this.state.loading ? 'wait' : 'pointer',
              opacity: this.state.loading ? 0.65 : 1,
            },
          },
          this.state.loading ? 'Memproses...' : '✨ Rapikan dengan AI',
        ),
        this.state.message
          ? h('p', { role: 'status' }, this.state.message)
          : null,
      );
    },
  });

  const AiOptimizePreview = createClass({
    render: function () {
      return h(
        'span',
        null,
        typeof this.props.value === 'string' ? this.props.value : '',
      );
    },
  });

  CMS.registerWidget('ai_optimize', AiOptimizeControl, AiOptimizePreview);
})();
