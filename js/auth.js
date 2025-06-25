const mockedUsers = [
    { username: 'admin@trabalho.com', password: 'admin123', role: 'gestao' },
    { username: 'user@trabalho.com', password: 'user123', role: 'lancamento' }
];

const isProduction = window.location.pathname.includes('/DW-25-Squads/');
const BASE_PATH = isProduction ? '/DW-25-Squads' : '';

window.addEventListener('DOMContentLoaded', () => checkLoggedIn());

function checkLoggedIn() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser && !isLoginPage()) {
        window.location.href = `${BASE_PATH}/index.html`;
        return;
    }

    if (loggedInUser && isLoginPage()) {
        const user = JSON.parse(loggedInUser);
        redirectToRolePage(user.role);
    }
}

function isLoginPage() {
    const currentPath = window.location.pathname;
    return (
        currentPath.endsWith(`${BASE_PATH}/index.html`) ||
        currentPath === `${BASE_PATH}/` ||
        currentPath === `${BASE_PATH}`
    );
}

document.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value.trim();

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

document.querySelectorAll('.forgot').forEach(element => {
    element.addEventListener('click', () => alert("Não tem como recuperar 👍"));
});

function redirectToRolePage(role) {
    switch (role) {
        case 'gestao':
            window.location.href = `${BASE_PATH}/gestao.html`;
            break;
        case 'lancamento':
            window.location.href = `${BASE_PATH}/lancamento.html`;
            break;
        default:
            window.location.href = `${BASE_PATH}/index.html`;
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = `${BASE_PATH}/index.html`;
}