exports.up = (pgm) => {
  pgm.addColumns('todos', {
    completed: {
      type: 'BOOLEAN',
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('todos', 'completed');
};
