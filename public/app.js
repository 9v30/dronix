document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById('loginBtn');
  const accountModal = document.getElementById('accountModal');
  const closeModal = document.getElementById('closeModal');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  // モーダルを開く
  loginBtn.addEventListener('click', () => {
    accountModal.style.display = 'flex';
  });

  // モーダルを閉じる
  closeModal.addEventListener('click', () => {
    accountModal.style.display = 'none';
  });

  // モーダル外側クリックで閉じる
  accountModal.addEventListener('click', (e) => {
    if (e.target === accountModal) {
      accountModal.style.display = 'none';
    }
  });

  // 新規登録フォームに切り替え
  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginError.style.display = 'none';  // エラーメッセージを隠す
  });

  // ログインフォームに切り替え
  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    registerError.style.display = 'none';  // エラーメッセージを隠す
  });

  // ログイン処理
  document.getElementById('loginFormElem').addEventListener('submit', async (e) => {
    e.preventDefault(); // デフォルトのフォーム送信を防ぐ

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      // ログイン成功
      localStorage.setItem('token', data.token); // トークンを保存
      document.getElementById('accountModal').style.display = 'none'; // モーダルを閉じる
      // ユーザー名を更新
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/me', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        const data = await response.json();
        if (data.success) {
          document.getElementById('username').textContent = data.user.username;
          document.getElementById('username').style.display = 'inline-block';
          document.getElementById('loginBtn').style.display = 'none'; // ログインボタンを非表示
        }
      }
    } else {
      // エラーがあった場合
      document.getElementById('loginError').textContent = data.error || 'ログイン失敗';
      document.getElementById('loginError').style.display = 'block';
    }
  });

  // 新規登録フォーム送信
  document.getElementById('registerFormElem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // エラーメッセージをリセット
    registerError.style.display = 'none';

    if (password !== confirmPassword) {
      registerError.textContent = 'パスワードが一致しません';
      registerError.style.display = 'block';
      return;
    }

    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      alert('登録成功');
      switchToLogin.click(); // 登録後、ログイン画面に切り替え
    } else {
      registerError.textContent = `登録失敗: ${data.error}`;
      registerError.style.display = 'block';  // エラーメッセージを表示
    }
  });

});

// ユーザー名タップ時に情報を表示
document.getElementById('username').addEventListener('click', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('ログインしてください');
    return;
  }

  const response = await fetch('/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();

  if (data.success) {
    // ユーザー情報をmainに表示
    const main = document.querySelector('main');
    main.innerHTML = `
      <h1>ユーザー情報</h1>
      <p><strong>ユーザー名:</strong> ${data.user.username}</p>
      <p><strong>作成日:</strong> ${new Date(data.user.created_at).toLocaleDateString()}</p>
      <button id="logoutBtn">ログアウト</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      location.reload();
    });

  } else {
    alert(data.error);
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (token) {
    // トークンがある場合は自動的にログイン状態にする
    const response = await fetch('/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      // ログイン状態を更新
      document.getElementById('username').textContent = data.user.username;
      document.getElementById('username').style.display = 'inline-block';
      document.getElementById('loginBtn').style.display = 'none';
    } else {
      localStorage.removeItem('token');
      document.getElementById('loginBtn').style.display = 'inline-block';
    }
  } else {
    document.getElementById('loginBtn').style.display = 'inline-block';
  }
});
