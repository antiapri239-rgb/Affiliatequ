(function () {
  const AiOptimizeControl = createClass({
    getInitialState: function () {
      return { loading: false, message: '' };
    },

    handleClick: async function () {
      if (typeof this.props.value !== 'string' || !this.props.value.trim()) {
        alert('Deskripsi masih kosong');
        return;
      }

      this.setState({ loading: true, message: '' });

      try {
        var response = await fetch('/api/optimize-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Teks Sementara',
            description: this.props.value,
            category: 'sunscreen',
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

        if (typeof result.description !== 'string') {
          throw new Error('Server tidak mengembalikan deskripsi yang valid.');
        }

        this.props.onChange(result.description);
        this.setState({ message: 'Deskripsi berhasil dirapikan.' });
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
