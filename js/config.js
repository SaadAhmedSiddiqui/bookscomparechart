(function (exports) {
  'use strict';

  exports.bookSequence = ['book1', 'book2'];
  exports.srt_data_path = 'data-file/{file_name}';
  exports.meta_data_path = 'data-file/metadata.txt';
  exports.web_worker_path = {
    load_chunks: 'web-worker/load-chunks-worker.js',
    load_inial_data: 'web-worker/load-initial-data-worker.js'
  };
  exports.book_content_url = 'https://raw.githubusercontent.com/OpenITI/i.mech/master/data/{book_id}-ara1-{page_string}';
  exports.book_github_url = 'https://raw.githubusercontent.com/OpenITI/i.mech/master/data/{book_id}-ara1';
  exports.page_string_format = '00000';
  exports.chunk_size = 300;
  exports.forward_chunk_count = 1;
  exports.backward_chunk_count = 1;
  exports.load_more_count = 2;
  exports.page_chunk_count = 200;


  exports.meta_data_mapping = [
    { key: 'book_id', cell: 0, type: 'string' },
    { key: 'book_author', cell: 1, type: 'string' },
    // { key: 'author_died', cell: 2, type: 'string' },
    { key: 'book_title', cell: 3, type: 'string' },
    { key: 'book_word_count', cell: 4, type: 'number' },
    { key: 'book_chunk_count', cell: 4, type: 'ceil', use: exports.chunk_size },
    { key: 'book_uri', cell: 5, type: 'string' },
    // { key: 'book_cat', cell: 6, type: 'string' },
    // { key: 'github_url', cell: 7, type: 'string' },
  ];
  exports.meta_data_book_id_cell = exports.meta_data_mapping[0].cell;

  exports.srt_data_mapping = [
    { key: 'book1_id', key2: 'book1_chunk', cell: 0, type: 'extract' },
    { key: 'book1_y1', cell: 2, type: 'number' },
    { key: 'book1_y2', cell: 3, type: 'number' },
    { key: 'book1_raw_content', cell: 1, type: 'string' },
    { key: 'book1_content', cell: 1, type: 'normalizedText' },

    { key: 'book2_id', key2: 'book2_chunk', cell: 6, type: 'extract' },
    { key: 'book2_y1', cell: 8, type: 'number' },
    { key: 'book2_y2', cell: 9, type: 'number' },
    { key: 'book2_raw_content', cell: 7, type: 'string' },
    { key: 'book2_content', cell: 7, type: 'normalizedText' }
  ];

})(window.config = {});