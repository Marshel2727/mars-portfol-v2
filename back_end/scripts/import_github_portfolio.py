"""Import curated GitHub repositories into the portfolio database.

The import is intentionally idempotent: projects are matched by GitHub URL and
skills are matched by name. Existing unrelated rows are never deleted.
"""

from __future__ import annotations

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app, db  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.skill import Skill  # noqa: E402


GITHUB_OWNER = "Marshel2727"
SEED_ASSET_DIR = BACKEND_ROOT / "seed_assets" / "projects"
UPLOAD_DIR = BACKEND_ROOT / "app" / "static" / "uploads" / "projects"


SKILLS = [
    {"name": "HTML & CSS", "category": "Frontend", "detail": "Semantic HTML, responsive layout, and maintainable visual styling."},
    {"name": "JavaScript", "category": "Frontend", "detail": "Interactive browser logic, DOM workflows, and client-side data rendering."},
    {"name": "TypeScript", "category": "Frontend", "detail": "Typed application code for safer component and API integration."},
    {"name": "React", "category": "Frontend", "detail": "Component-driven interfaces and interactive application state."},
    {"name": "Next.js", "category": "Frontend", "detail": "Full-stack React applications, routing, server actions, and production builds."},
    {"name": "Tailwind CSS", "category": "Frontend", "detail": "Utility-first responsive UI implementation and design-system styling."},
    {"name": "Python", "category": "Backend", "detail": "Backend services, automation tools, local AI integration, and testable workflows."},
    {"name": "Flask", "category": "Backend", "detail": "Modular REST APIs with blueprints, authentication, and database services."},
    {"name": "FastAPI", "category": "Backend", "detail": "Typed asynchronous APIs for AI and local service integrations."},
    {"name": "REST API", "category": "Backend", "detail": "Resource-oriented endpoints, validation, authentication, and client integration."},
    {"name": "SQLAlchemy", "category": "Data", "detail": "Relational models, migrations, and service-layer database access."},
    {"name": "MySQL", "category": "Data", "detail": "Relational persistence for users, operations, content, and telemetry."},
    {"name": "JWT Auth", "category": "Security", "detail": "Token-based access control for protected API and admin workflows."},
    {"name": "Docker Compose", "category": "Infrastructure", "detail": "Repeatable multi-service development and deployment environments."},
    {"name": "ESP32", "category": "IoT & Systems", "detail": "Sensor acquisition and device-to-backend telemetry integration."},
    {"name": "WebSocket", "category": "IoT & Systems", "detail": "Realtime delivery of device and application state to dashboards."},
    {"name": "Ollama", "category": "AI", "detail": "Local model runtime for private assistant and translation workflows."},
    {"name": "MCP", "category": "Developer Tools", "detail": "Focused tools that expose safe, low-context capabilities to AI clients."},
    {"name": "Chrome Extension", "category": "Developer Tools", "detail": "Manifest V3 browser extensions with content scripts and local caching."},
    {"name": "Git & GitHub", "category": "Developer Tools", "detail": "Repository workflows, guarded commits, branch checks, and publishing."},
]


PROJECTS = [
    {
        "title": "Entok Monitoring",
        "sub_title": "Platform operasional peternakan dengan telemetri timbangan dan dashboard realtime.",
        "description": "Sistem full-stack untuk memantau operasional peternakan entok. Repository menggabungkan dashboard Next.js, REST API Flask, MySQL, komunikasi realtime, firmware ESP32, serta alur data timbangan dan batch pemberian pakan.",
        "image": "entok-monitoring.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/entok-monitoring",
        "category": "IoT System",
        "created_at": "2026-06-08T06:11:00+00:00",
        "updated_at": "2026-07-10T16:07:17+00:00",
        "tech_tags": ["Next.js", "TypeScript", "Flask", "MySQL", "ESP32", "WebSocket", "Docker Compose"],
        "skills": ["Next.js", "React", "TypeScript", "Flask", "MySQL", "ESP32", "WebSocket", "Docker Compose", "REST API"],
        "architecture_steps": [
            {"label": "01", "title": "Device Telemetry", "description": "ESP32 dan modul timbangan mengirim pembacaan sensor serta data batch pakan ke endpoint backend."},
            {"label": "02", "title": "Operational API", "description": "Flask menangani validasi, aturan bisnis, autentikasi, migrasi, dan penyimpanan MySQL."},
            {"label": "03", "title": "Realtime Delivery", "description": "Socket.IO menyebarkan pembaruan operasional ke dashboard tanpa menunggu refresh manual."},
            {"label": "04", "title": "Web Dashboard", "description": "Next.js menyajikan dashboard, portal penjaga, dan website publik dalam satu frontend."},
        ],
    },
    {
        "title": "Mars AI Local",
        "sub_title": "Asisten AI privat berbasis Ollama dengan chat multi-user dan peringkas WhatsApp.",
        "description": "Asisten AI local-first yang menjalankan model melalui Ollama agar percakapan tetap berada di komputer pengguna. Arsitekturnya menghubungkan Next.js, FastAPI, MySQL, dan microservice WhatsApp berbasis Node.js dalam lingkungan Docker Compose.",
        "image": "mars-ai-local.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/mars-web-ai-local",
        "category": "AI Application",
        "created_at": "2026-07-23T03:16:19+00:00",
        "updated_at": "2026-07-23T07:40:12+00:00",
        "tech_tags": ["Next.js", "FastAPI", "Ollama", "MySQL", "Node.js", "Docker Compose"],
        "skills": ["Next.js", "React", "Python", "FastAPI", "Ollama", "MySQL", "Docker Compose", "REST API"],
        "architecture_steps": [
            {"label": "01", "title": "User Experience", "description": "Next.js menyediakan autentikasi, sesi chat, serta antarmuka ringkasan pesan."},
            {"label": "02", "title": "Application API", "description": "FastAPI mengelola konteks percakapan, identitas pengguna, dan komunikasi database."},
            {"label": "03", "title": "Local Inference", "description": "Ollama menjalankan model lokal sehingga isi percakapan tidak perlu dikirim ke layanan model cloud."},
            {"label": "04", "title": "WhatsApp Service", "description": "Microservice Node.js mengambil pesan yang diizinkan lalu meneruskannya untuk diringkas oleh AI."},
        ],
    },
    {
        "title": "Mars Web Translator AI",
        "sub_title": "Penerjemah dokumentasi teknis langsung di browser dengan model AI lokal.",
        "description": "Ekstensi Chrome/Brave yang menerjemahkan teks halaman ke Bahasa Indonesia melalui FastAPI dan Ollama. Sistem memprioritaskan teks yang terlihat, melanjutkan antrean di latar belakang, menjaga istilah teknis, dan menyimpan hasil berulang di cache browser.",
        "image": "mars-web-translator-ai.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/mars-web-translator-ai",
        "category": "AI Application",
        "created_at": "2026-06-15T08:49:24+00:00",
        "updated_at": "2026-07-26T13:31:25+00:00",
        "tech_tags": ["Manifest V3", "JavaScript", "FastAPI", "Ollama", "Qwen 2.5", "Pydantic"],
        "skills": ["Chrome Extension", "JavaScript", "Python", "FastAPI", "Ollama", "REST API"],
        "architecture_steps": [
            {"label": "01", "title": "Viewport Scanner", "description": "Content script memindai node teks dan mendahulukan konten yang sedang terlihat oleh pengguna."},
            {"label": "02", "title": "Batch Translation API", "description": "Ekstensi mengirim kumpulan teks ke FastAPI melalui endpoint terstruktur."},
            {"label": "03", "title": "Local Model", "description": "Model Qwen khusus di Ollama menerjemahkan tanpa mengubah kode, URL, perintah, atau nama paket."},
            {"label": "04", "title": "DOM Restore & Cache", "description": "Hasil ditulis kembali ke halaman dan disimpan di chrome.storage.local untuk pemakaian ulang."},
        ],
    },
    {
        "title": "Mars MCP Backend Analyzer",
        "sub_title": "MCP read-only untuk memetakan backend Python dengan konteks yang hemat token.",
        "description": "Analyzer lokal yang mengekspos tool kecil dan terarah untuk merencanakan analisis, memetakan project, memilih file relevan, membuat outline, mencari kode, dan membaca rentang baris secara aman tanpa mengirim seluruh repository ke model.",
        "image": "mars-mcp-backend-analyzer.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/Mars-MCP-backend-analyzer",
        "category": "Developer Tool",
        "created_at": "2026-07-08T17:16:17+00:00",
        "updated_at": "2026-07-08T17:35:50+00:00",
        "tech_tags": ["Python", "MCP", "CLI", "AST", "Pytest", "Ollama"],
        "skills": ["Python", "MCP", "Ollama"],
        "architecture_steps": [
            {"label": "01", "title": "Plan", "description": "Tool planner menentukan kedalaman dan langkah analisis berdasarkan pertanyaan pengguna."},
            {"label": "02", "title": "Compact Map", "description": "Scanner membangun brief, struktur file, dan simbol penting sambil menghormati ignore rules."},
            {"label": "03", "title": "Relevant Context", "description": "Pencarian memilih file dan baris yang paling berkaitan dengan tugas saat ini."},
            {"label": "04", "title": "Safe Read", "description": "Proteksi path traversal dan pemblokiran file sensitif menjaga analyzer tetap read-only."},
        ],
    },
    {
        "title": "Mars MCP Git Publisher",
        "sub_title": "Tool MCP untuk preview, commit, dan push Git dengan guard rails.",
        "description": "Server MCP Python yang menyederhanakan workflow publikasi Git menjadi satu tool terjaga. Sebelum commit dan push, sistem melakukan safety check terhadap repository, branch aktif, perubahan, dan target remote agar operasi tetap eksplisit dan mudah diaudit.",
        "image": "mars-mcp-git-publisher.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/mars-MCP-push-github",
        "category": "Developer Tool",
        "created_at": "2026-07-11T19:24:03+00:00",
        "updated_at": "2026-07-12T06:22:27+00:00",
        "tech_tags": ["Python", "MCP", "Git", "Pytest", "Ruff"],
        "skills": ["Python", "MCP", "Git & GitHub"],
        "architecture_steps": [
            {"label": "01", "title": "Repository Preview", "description": "Tool membaca branch, remote, dan perubahan untuk menetapkan cakupan publikasi."},
            {"label": "02", "title": "Guarded Commit", "description": "Safety checks dijalankan sebelum membuat commit dengan pesan yang diberikan pengguna."},
            {"label": "03", "title": "Branch-aware Push", "description": "Commit dipublikasikan ke origin pada branch aktif tanpa mengganti riwayat secara paksa."},
        ],
    },
    {
        "title": "Mars Face — AuraReader",
        "sub_title": "Eksperimen vision AI untuk analisis ekspresi dan ramalan hiburan dari webcam.",
        "description": "Aplikasi Next.js yang mengambil foto dari webcam, mengompres gambar di browser, lalu mengirimkannya melalui Server Action ke model vision DigitalOcean. Hasil HTML dibersihkan dengan DOMPurify dan ditampilkan dengan efek typewriter serta penanganan error yang jelas.",
        "image": "mars-face.png",
        "demo_url": "https://mars-face.vercel.app",
        "github_url": "https://github.com/Marshel2727/mars-face",
        "category": "AI Application",
        "created_at": "2026-04-29T10:10:39+00:00",
        "updated_at": "2026-05-14T08:14:47+00:00",
        "tech_tags": ["Next.js", "React", "JavaScript", "React Webcam", "Vision AI", "DOMPurify"],
        "skills": ["Next.js", "React", "JavaScript", "Tailwind CSS"],
        "architecture_steps": [
            {"label": "01", "title": "Camera Capture", "description": "React Webcam menangkap wajah dengan rasio adaptif dan kompresi JPEG di canvas."},
            {"label": "02", "title": "Server Action", "description": "Foto dan request ID diteruskan ke server agar kunci layanan AI tidak berada di browser."},
            {"label": "03", "title": "Vision Inference", "description": "Model vision menghasilkan analisis hiburan dalam struktur HTML yang dibatasi oleh prompt keselamatan."},
            {"label": "04", "title": "Safe Presentation", "description": "DOMPurify menyaring respons sebelum hasil ditampilkan secara bertahap pada antarmuka."},
        ],
    },
    {
        "title": "Mars Buket Backend",
        "sub_title": "REST API e-commerce buket untuk katalog, alamat, autentikasi, dan pesanan.",
        "description": "Backend modular berbasis Flask untuk aplikasi penjualan buket. Struktur repository memisahkan model, route, schema, service, dan utility, dengan dukungan JWT, SQLAlchemy, MySQL, serta migrasi Alembic untuk alur produk dan pesanan.",
        "image": "mars-buket.svg",
        "demo_url": None,
        "github_url": "https://github.com/Marshel2727/mars-buket",
        "category": "Backend API",
        "created_at": "2026-05-21T11:27:34+00:00",
        "updated_at": "2026-05-22T14:23:02+00:00",
        "tech_tags": ["Python", "Flask", "MySQL", "SQLAlchemy", "JWT", "Alembic"],
        "skills": ["Python", "Flask", "MySQL", "SQLAlchemy", "JWT Auth", "REST API"],
        "architecture_steps": [
            {"label": "01", "title": "Resource Routes", "description": "Blueprint memisahkan endpoint autentikasi, produk, alamat, dan pesanan."},
            {"label": "02", "title": "Service Layer", "description": "Aturan bisnis diletakkan di service agar route tetap tipis dan mudah dirawat."},
            {"label": "03", "title": "Relational Data", "description": "SQLAlchemy memodelkan data dan Alembic menjaga perubahan skema database."},
            {"label": "04", "title": "Protected Access", "description": "JWT melindungi operasi pengguna dan alur transaksi yang memerlukan identitas."},
        ],
    },
    {
        "title": "Mars Portfolio",
        "sub_title": "Portfolio full-stack dengan CMS admin, studi kasus, dan deployment Docker.",
        "description": "Portfolio utama yang menggabungkan frontend Next.js, backend Flask, MySQL, autentikasi admin, manajemen project dan skill, galeri, pesan kontak, serta konten halaman yang dapat diedit dari panel admin. Deployment lokal disatukan melalui Docker Compose dan Nginx.",
        "image": "mars-portfolio.png",
        "demo_url": "https://mars-porto.vercel.app",
        "github_url": "https://github.com/Marshel2727/mars_porto",
        "category": "Web Application",
        "created_at": "2026-04-04T00:48:04+00:00",
        "updated_at": "2026-07-12T10:25:25+00:00",
        "tech_tags": ["Next.js", "TypeScript", "Flask", "MySQL", "Docker Compose", "Nginx", "JWT"],
        "skills": ["Next.js", "React", "TypeScript", "Python", "Flask", "MySQL", "SQLAlchemy", "JWT Auth", "Docker Compose", "REST API"],
        "architecture_steps": [
            {"label": "01", "title": "Public Experience", "description": "Next.js menyajikan profil, katalog project, detail studi kasus, skill, resume, dan kontak."},
            {"label": "02", "title": "Admin CMS", "description": "Panel terlindungi mengelola project, skill, galeri, profil, pesan, dan seluruh copy halaman publik."},
            {"label": "03", "title": "Flask API", "description": "Service backend menangani validasi, autentikasi JWT, upload, dan kontrak data frontend."},
            {"label": "04", "title": "Container Delivery", "description": "Nginx mengarahkan trafik ke frontend dan backend yang berjalan bersama MySQL melalui Docker Compose."},
        ],
    },
    {
        "title": "Culiner Foods",
        "sub_title": "Katalog kuliner responsif dengan detail menu berbasis data JSON.",
        "description": "Website katalog makanan berbasis HTML, CSS, dan JavaScript. Data menu dimuat dari JSON lokal, dirender menjadi kartu visual, lalu diteruskan ke halaman detail menggunakan parameter ID pada URL.",
        "image": "culiner-foods.png",
        "demo_url": "https://culiner-foods.vercel.app",
        "github_url": "https://github.com/Marshel2727/culiner-foods",
        "category": "Web Application",
        "created_at": "2026-02-19T10:04:40+00:00",
        "updated_at": "2026-04-07T00:34:40+00:00",
        "tech_tags": ["HTML", "CSS", "JavaScript", "JSON", "Vercel"],
        "skills": ["HTML & CSS", "JavaScript"],
        "architecture_steps": [
            {"label": "01", "title": "Local Catalog Data", "description": "Data menu, harga, kalori, porsi, dan gambar disimpan dalam berkas JSON."},
            {"label": "02", "title": "Dynamic Cards", "description": "JavaScript membaca JSON dan membangun kartu menu beserta statistiknya di DOM."},
            {"label": "03", "title": "Detail Navigation", "description": "ID menu diteruskan melalui query string untuk menampilkan data item pada halaman detail."},
        ],
    },
    {
        "title": "Katalog Audio",
        "sub_title": "Katalog perangkat audio interaktif dengan spesifikasi produk berbasis JSON.",
        "description": "Website katalog perangkat audio yang menampilkan produk, warna, bobot, latensi, baterai, dan harga. JavaScript menghasilkan kartu produk dari JSON lokal dan membuka halaman detail berdasarkan ID item.",
        "image": "katalog-audio.png",
        "demo_url": "https://katalog-audio-ten.vercel.app",
        "github_url": "https://github.com/Marshel2727/katalog-audio",
        "category": "Web Application",
        "created_at": "2026-01-20T10:22:35+00:00",
        "updated_at": "2026-02-11T15:20:13+00:00",
        "tech_tags": ["HTML", "CSS", "JavaScript", "JSON", "Vercel"],
        "skills": ["HTML & CSS", "JavaScript"],
        "architecture_steps": [
            {"label": "01", "title": "Product Dataset", "description": "Spesifikasi perangkat audio dan referensi gambar dikelola dalam satu dataset JSON."},
            {"label": "02", "title": "Catalog Rendering", "description": "JavaScript membuat kartu produk dan menampilkan atribut teknis langsung di halaman utama."},
            {"label": "03", "title": "Item Detail", "description": "Halaman detail membaca parameter ID untuk memilih produk yang diminta pengguna."},
        ],
    },
]


def parse_github_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value).replace(tzinfo=None)


def copy_project_assets() -> list[str]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    copied = []
    expected_files = {project["image"] for project in PROJECTS}
    for filename in sorted(expected_files):
        source = SEED_ASSET_DIR / filename
        if not source.is_file():
            raise FileNotFoundError(f"Missing project cover: {source}")
        destination = UPLOAD_DIR / filename
        shutil.copy2(source, destination)
        copied.append(filename)
    return copied


def upsert_skills() -> tuple[dict[str, Skill], int, int]:
    existing = {skill.name.casefold(): skill for skill in Skill.query.all()}
    records: dict[str, Skill] = {}
    created = 0
    updated = 0

    for order, payload in enumerate(SKILLS, start=1):
        skill = existing.get(payload["name"].casefold())
        if skill is None:
            skill = Skill(name=payload["name"])
            db.session.add(skill)
            created += 1
        else:
            updated += 1

        skill.level = "Intermediate"
        skill.icon_url = None
        skill.category = payload["category"]
        skill.detail = payload["detail"]
        skill.proficiency = 70
        skill.years_experience = "Portfolio 2026"
        skill.display_order = order
        records[payload["name"]] = skill

    db.session.flush()
    return records, created, updated


def upsert_projects(skills: dict[str, Skill]) -> tuple[int, int, list[dict[str, object]]]:
    existing = {
        (project.github_url or "").strip().rstrip("/").casefold(): project
        for project in Project.query.all()
        if project.github_url
    }
    created = 0
    updated = 0
    imported = []

    for payload in PROJECTS:
        github_key = payload["github_url"].rstrip("/").casefold()
        project = existing.get(github_key)
        if project is None:
            project = Project(
                title=payload["title"],
                description=payload["description"],
                image_url=f"/static/uploads/projects/{payload['image']}",
            )
            project.created_at = parse_github_datetime(payload["created_at"])
            db.session.add(project)
            created += 1
        else:
            updated += 1

        project.title = payload["title"]
        project.sub_title = payload["sub_title"]
        project.description = payload["description"]
        project.image_url = f"/static/uploads/projects/{payload['image']}"
        project.demo_url = payload["demo_url"]
        project.github_url = payload["github_url"]
        project.category = payload["category"]
        project.tech_tags = payload["tech_tags"]
        project.architecture_steps = payload["architecture_steps"]
        project.updated_at = parse_github_datetime(payload["updated_at"])
        project.skills = [skills[name] for name in payload["skills"]]

        db.session.flush()
        imported.append({"id": project.id, "title": project.title, "github_url": project.github_url})

    return created, updated, imported


def main() -> None:
    copied_assets = copy_project_assets()
    app = create_app()
    with app.app_context():
        try:
            skills, skills_created, skills_updated = upsert_skills()
            projects_created, projects_updated, imported = upsert_projects(skills)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        print(json.dumps({
            "github_owner": GITHUB_OWNER,
            "assets_copied": copied_assets,
            "skills_created": skills_created,
            "skills_updated": skills_updated,
            "projects_created": projects_created,
            "projects_updated": projects_updated,
            "projects": imported,
        }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
