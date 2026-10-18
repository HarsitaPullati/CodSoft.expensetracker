// ---------- Setup ----------
const STORAGE_KEY = 'codsoft_expense_tracker';
const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Salary', 'Other'];

// Shortcut: $('id') means document.getElementById('id')
function $(id) {
  return document.getElementById(id);
}

// Show a number as money, e.g. 1500 -> ₹1,500.00
function formatMoney(number) {
  return '₹' + number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Today's date in yyyy-mm-dd format (needed by the date input)
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Local Storage (safe versions) ----------
function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    // Storage blocked: the app still works, but data won't survive a refresh
  }
}

let transactions = loadTransactions();
let editId = null; // id of the transaction being edited, or null

// ---------- Fill dropdowns and default date ----------
CATEGORIES.forEach(function (name) {
  $('category').add(new Option(name, name));
});

$('filter').add(new Option('All categories', 'all'));
CATEGORIES.forEach(function (name) {
  $('filter').add(new Option(name, name));
});

$('date').value = today();

// ---------- Draw everything on the page ----------
function render() {
  // Totals
  let income = 0;
  let expense = 0;
  transactions.forEach(function (t) {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });
  const balance = income - expense;

  $('income').textContent = formatMoney(income);
  $('expense').textContent = formatMoney(expense);
  $('balance').textContent = formatMoney(balance);
  $('balance').className = balance < 0 ? 'neg' : 'pos';

  // Apply the category filter, newest first
  const selected = $('filter').value;
  const shown = transactions
    .filter(function (t) {
      return selected === 'all' || t.category === selected;
    })
    .sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

  // Build the list
  $('list').innerHTML = '';
  shown.forEach(function (t) {
    const row = document.createElement('li');
    const sign = t.type === 'income' ? '+' : '−';
    const colorClass = t.type === 'income' ? 'pos' : 'neg';

    row.innerHTML =
      '<div class="info"><b></b><small>' + t.date + ' · ' + t.category + '</small></div>' +
      '<div class="right">' +
        '<span class="amt ' + colorClass + '">' + sign + formatMoney(t.amount) + '</span>' +
        '<button data-edit="' + t.id + '">Edit</button>' +
        '<button class="del" data-del="' + t.id + '">Delete</button>' +
      '</div>';

    row.querySelector('b').textContent = t.description;
    $('list').appendChild(row);
  });

  // Empty message
  $('empty').hidden = shown.length > 0;
  $('empty').textContent = transactions.length === 0
    ? 'No transactions yet. Add your first one above.'
    : 'No transactions in this category.';
}

// ---------- Reset the form back to "add" mode ----------
function resetForm() {
  editId = null;
  $('form').reset();
  $('date').value = today();
  $('formTitle').textContent = 'Add transaction';
  $('saveBtn').textContent = 'Add transaction';
  $('cancelBtn').hidden = true;
  $('error').textContent = '';
}

// ---------- Add or save a transaction ----------
$('form').addEventListener('submit', function (event) {
  event.preventDefault();

  const description = $('desc').value.trim();
  const amount = parseFloat($('amount').value);
  const date = $('date').value;

  // Validation
  if (description === '') {
    $('error').textContent = 'Enter a description.';
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    $('error').textContent = 'Enter an amount greater than 0.';
    return;
  }
  if (date === '') {
    $('error').textContent = 'Choose a date.';
    return;
  }

  const details = {
    type: $('type').value,
    description: description,
    amount: amount,
    category: $('category').value,
    date: date
  };

  if (editId !== null) {
    // Update the existing transaction
    transactions = transactions.map(function (t) {
      return t.id === editId ? Object.assign({}, t, details) : t;
    });
  } else {
    // Add a new transaction
    details.id = Date.now().toString();
    transactions.push(details);
  }

  saveTransactions();
  resetForm();
  render();
});

// ---------- Edit and Delete buttons ----------
$('list').addEventListener('click', function (event) {
  const deleteId = event.target.dataset.del;
  const editClickId = event.target.dataset.edit;

  if (deleteId) {
    if (confirm('Delete this transaction?')) {
      transactions = transactions.filter(function (t) {
        return t.id !== deleteId;
      });
      saveTransactions();
      render();
    }
  }

  if (editClickId) {
    const t = transactions.find(function (item) {
      return item.id === editClickId;
    });
    editId = t.id;
    $('type').value = t.type;
    $('desc').value = t.description;
    $('amount').value = t.amount;
    $('category').value = t.category;
    $('date').value = t.date;
    $('formTitle').textContent = 'Edit transaction';
    $('saveBtn').textContent = 'Save changes';
    $('cancelBtn').hidden = false;
    $('form').scrollIntoView({ behavior: 'smooth' });
  }
});

$('cancelBtn').addEventListener('click', resetForm);
$('filter').addEventListener('change', render);

// ---------- First draw ----------
render();