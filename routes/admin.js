const express = require("express");
const router = express.Router();

// Rota para a página de login do administrador
router.get("/login", (req, res) => {
    res.render("admin/login", { title: "Login de Administrador" });
});

// Rota para processar o login do administrador (ilustrativo)
router.post("/dashboard", (req, res) => {
    // Lógica de autenticação ilustrativa
    const { email, password } = req.body;
    if (email === "admin@example.com" && password === "password") {
        // Simula um login bem-sucedido
        req.session.user = { id: 1, email: "admin@example.com", type: "admin" };
        res.redirect("/admin/dashboard_admin"); // Redireciona para o dashboard ilustrativo
    } else {
        // Simula falha no login
        res.render("admin/login", { title: "Login de Administrador", error: "Credenciais inválidas" });
    }
});

// Rota para o dashboard do administrador (ilustrativo)
router.get("/dashboard_admin", (req, res) => {
    // Verifica se o usuário está logado como administrador (ilustrativo)
    if (req.session.user && req.session.user.type === "admin") {
        res.render("admin/dashboard_admin", { title: "Dashboard do Administrador" });
    } else {
        res.redirect("/admin/login");
    }
});

module.exports = router;
