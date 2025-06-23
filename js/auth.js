const mockedUsers = [
    { username: 'admin', password: 'admin123', role: 'gestao' },
    { username: 'user', password: 'user123', role: 'lancamento' }
];

window.addEventListener('DOMContentLoaded', () => checkLoggedIn());

function checkLoggedIn() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (!loggedInUser && !isLoginPage()) {
        window.location.href = '/index.html';
        return;
    }

    if (loggedInUser && isLoginPage()) {
        const user = JSON.parse(loggedInUser);
        redirectToRolePage(user.role);
    }
}

function isLoginPage() {
    return (
        window.location.pathname.endsWith('/index.html') ||
        window.location.pathname === '/'
    );
}

document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    try {
        const user = mockedUsers.find(u => u.username === username && u.password === password);

        if (!user) {
            alert('Credenciais inválidas!');
            return;
        }

        const userToStore = { username: user.username, role: user.role };
        sessionStorage.setItem('loggedInUser', JSON.stringify(userToStore));

        redirectToRolePage(user.role);
    } catch (error) {
        alert('Ocorreu um erro durante o login. Tente novamente.');
        console.error('Login error:', error);
    }
});

document.getElementById('logoutButton')?.addEventListener('click', () => logout());

function redirectToRolePage(role) {
    switch (role) {
        case 'gestao':
            window.location.href = '/gestao.html';
            break;
        case 'lancamento':
            window.location.href = '/lancamento.html';
            break;
        default:
            window.location.href = '/index.html';
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '/index.html';
}