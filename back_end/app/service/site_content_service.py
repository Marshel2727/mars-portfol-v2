from copy import deepcopy

from app import db
from app.models.site_content import SiteContent


DEFAULT_SITE_CONTENT = {
    'global': {
        'brand_name': 'MARSHEL',
        'brand_descriptor': '/ SOFTWARE × HARDWARE',
        'brand_aria_label': 'Marshel Software dan Hardware, kembali ke beranda',
        'nav_links': [
            {'label': 'Beranda / Tentang', 'href': '/'},
            {'label': 'Skills', 'href': '/skills'},
            {'label': 'Project', 'href': '/projects'},
            {'label': 'Kontak', 'href': '/contact'},
        ],
        'resume_button_label': 'Resume // CV',
        'mobile_menu_open_label': 'Menu +',
        'mobile_menu_close_label': 'Tutup ×',
        'footer_text': 'BUILT WITH INTENT',
        'availability_label': 'TERBUKA UNTUK KOLABORASI',
    },
    'home': {
        'hero_eyebrow': 'FULL-STACK DEVELOPMENT / IoT / AI',
        'hero_title': 'Membangun software yang terhubung dengan dunia nyata.',
        'hero_description': 'Saya membangun aplikasi web, backend, dan sistem IoT—dari antarmuka pengguna hingga API, database, deployment, dan integrasi perangkat.',
        'primary_action_label': 'Lihat project',
        'secondary_action_label': 'Tentang saya',
        'stack_label': 'CORE STACK:',
        'tech_stack': ['Next.js', 'React', 'TypeScript', 'Node.js', 'Python', 'ESP32 / IoT', 'Docker', 'PostgreSQL', 'Tailwind CSS'],
        'metrics': [
            {'value': 'AUTO_PROJECT_COUNT', 'label': 'Project Selesai'},
            {'value': '03', 'label': 'Disiplin Utama (Web / API / IoT)'},
            {'value': '100%', 'label': 'Fokus pada Clarity & Reliability'},
        ],
        'selected_work_eyebrow': 'PROJECT PILIHAN / 02',
        'selected_work_title': 'Produk yang selesai berbicara lewat hasil.',
        'selected_work_description': 'Contoh bagaimana keputusan antarmuka, struktur data, dan delivery disatukan menjadi produk yang dapat digunakan.',
        'selected_project_count': 2,
        'profile_eyebrow': 'TENTANG / KAPABILITAS / 03',
        'profile_title': 'Dari antarmuka hingga perangkat, satu sistem.',
        'profile_discipline': 'Full-Stack Development / IoT / AI',
        'profile_fallback_bio': 'Saya bekerja di pertemuan antara interface, data, dan perangkat. Tujuannya sederhana: sistem kompleks tetap mudah dipahami oleh orang yang memakainya.',
        'cv_action_label': 'Lihat CV',
        'principle_label': 'PRINCIPLE',
        'principle_text': 'Clarity first. Complexity stays behind the interface.',
        'capabilities': [
            {'title': 'Interface Engineering', 'description': 'Merancang antarmuka responsif dengan struktur visual yang jelas, interaksi yang konsisten, dan pengalaman yang tetap baik di berbagai perangkat.', 'tag': 'Frontend'},
            {'title': 'Backend & API', 'description': 'Merancang API, autentikasi, logika aplikasi, dan alur data dengan struktur yang modular dan mudah dikembangkan.', 'tag': 'API Systems'},
            {'title': 'IoT Integration', 'description': 'Mengintegrasikan sensor, mikrokontroler, komunikasi data, backend, dan dashboard menjadi satu sistem yang dapat dipantau dan dikendalikan.', 'tag': 'IoT'},
        ],
        'process_eyebrow': 'PROSES ENGINEERING / 04',
        'process_title': 'Dari pertanyaan yang tepat menuju sistem yang bekerja.',
        'process_description': 'Setiap project dimulai dari memahami masalah, lalu menerjemahkannya menjadi keputusan desain dan teknis yang dapat diuji.',
        'process_steps': [
            {'title': 'Pahami masalah', 'description': 'Memahami pengguna, kebutuhan, batasan, dan tujuan sebelum menentukan solusi.'},
            {'title': 'Rancang sistem', 'description': 'Menentukan arsitektur, alur data, komponen, dan teknologi sebelum implementasi berkembang terlalu jauh.'},
            {'title': 'Bangun & iterasi', 'description': 'Mengembangkan fitur dalam bagian kecil, mengujinya, lalu memperbaiki berdasarkan hasil nyata.'},
            {'title': 'Uji & deploy', 'description': 'Memverifikasi fungsi penting, menangani edge case, lalu menyiapkan sistem untuk digunakan.'},
        ],
        'contact_eyebrow': 'MULAI DISKUSI / 05',
        'contact_title': 'Punya sistem yang perlu dibuat lebih jelas?',
        'contact_description': 'Ceritakan masalah, pengguna, dan konteks teknisnya. Kita mulai dengan memetakan langkah pertama yang paling masuk akal.',
        'brief_builder_label': 'INTERACTIVE BRIEF BUILDER',
        'brief_builder_description': 'Pilih jenis proyek yang sedang Anda rencanakan:',
        'brief_focus_label': 'FOKUS',
        'brief_expectation_label': 'EKSPEKTASI',
        'brief_action_prefix': 'Kirim brief',
        'project_types': [
            {'id': 'web', 'label': 'Web App', 'description': 'Aplikasi web interaktif dengan performa tinggi'},
            {'id': 'iot', 'label': 'IoT & Hardware', 'description': 'Integrasi sensor, mikrokontroler & dashboard monitoring'},
            {'id': 'backend', 'label': 'Backend API', 'description': 'Arsitektur REST API, database & autentikasi aman'},
            {'id': 'fullstack', 'label': 'Full Stack System', 'description': 'Solusi lengkap dari frontend, API hingga sistem database'},
        ],
        'telemetry': {
            'title': 'LIVE SYSTEM TELEMETRY',
            'pause_label': 'PAUSE',
            'live_label': 'LIVE',
            'node_status_label': 'NODE STATUS',
            'node_status_value': 'ONLINE',
            'latency_label': 'PING LATENCY',
            'protocol_label': 'PROTOCOL',
            'protocol_value': 'MQTT / WS',
            'packets_label': 'TELEMETRY PACKETS',
            'nodes_value': 'NODES: ESP32-S3 / REST API / POSTGRES',
        },
    },
    'projects': {
        'hero_eyebrow': 'PROJECTS & SKILLS / INDEX',
        'hero_title': 'Sistem dan produk yang sudah saya bangun.',
        'hero_description': 'Jelajahi karya berdasarkan kategori dan lihat teknologi yang digunakan pada setiap project.',
        'filter_label': 'FILTER PROJECT',
        'search_placeholder': 'Cari project atau tech stack...',
        'all_category_label': 'Semua',
        'index_eyebrow': 'KARYA TERBARU',
        'index_title': 'Project pilihan',
        'displayed_suffix': 'DITAMPILKAN',
        'card_action_label': 'Lihat studi kasus',
    },
    'skills': {
        'hero_eyebrow': 'TECHNICAL EXPERTISE / INDEX',
        'hero_title': 'Kapabilitas & Spesifikasi Teknis',
        'hero_description': 'Membangun sistem digital yang andal, scalable, dan terintegrasi—dari arsitektur frontend modern, REST API backend, hingga komunikasi perangkat IoT dan hardware secara presisi.',
        'competencies_eyebrow': 'CAPABILITIES / 01',
        'competencies_title': 'Core Competencies',
        'specifications_eyebrow': 'SPECIFICATIONS / 02',
        'specifications_title': 'Technical Specifications',
        'table_headers': ['TECHNOLOGY', 'CATEGORY', 'PROFICIENCY', 'YEARS EQ.'],
        'timeline_eyebrow': 'TIMELINE / 03',
        'timeline_title': 'Milestones',
        'milestones': [
            {'period': '2024 - PRESENT', 'role': 'Full Stack & IoT Systems Engineer', 'description': 'Spearheaded complex IoT interface integration, real-time telemetry dashboards, and Next.js web application architecture with high reliability.'},
            {'period': '2023 - 2024', 'role': 'Frontend & Systems Developer', 'description': 'Built high-performance responsive web interfaces, state management architectures, and robust backend REST APIs.'},
            {'period': '2022 - 2023', 'role': 'Hardware & Embedded Developer', 'description': 'Designed microcontroller sensor nodes, wireless telemetry protocols, and hardware-software integration loops.'},
        ],
        'cta_eyebrow': 'KOLABORASI',
        'cta_title': 'Siap membangun sistem bersama?',
        'cta_description': 'Lihat bagaimana kapabilitas teknis ini diterapkan pada produk dan proyek nyata.',
        'projects_action_label': 'Lihat Project →',
        'contact_action_label': 'Hubungi Saya',
    },
    'contact': {
        'eyebrow': 'CONTACT / START A CONVERSATION',
        'title': 'Ceritakan sistem yang ingin dibuat lebih jelas.',
        'description': 'Bagikan tujuan, pengguna, dan tantangan utamanya. Saya akan membantu memetakan langkah pertama yang masuk akal.',
        'availability_label': '● OPEN FOR SELECTED COLLABORATIONS',
        'form_eyebrow': 'PROJECT INTAKE',
        'name_label': 'Nama',
        'name_placeholder': 'Masukkan nama',
        'email_label': 'Email',
        'email_placeholder': 'alamat@email.com',
        'message_label': 'Pesan',
        'message_placeholder': 'Tujuan, pengguna, dan tantangan project',
        'submit_label': 'Kirim pesan',
        'submitting_label': 'Mengirim…',
        'success_message': 'Pesan berhasil dikirim. Terima kasih—saya akan meninjaunya segera.',
        'error_message': 'Pesan gagal dikirim. Periksa koneksi lalu coba lagi.',
        'toast_success': 'Pesan berhasil dikirim ke Marshel!',
        'toast_error': 'Gagal mengirim pesan. Silakan coba lagi.',
        'prefill_focus_label': 'Fokus Project',
        'prefill_general_label': 'Umum',
        'prefill_detail_label': 'Tujuan & Detail Project',
        'name_required_message': 'Nama wajib diisi.',
        'email_required_message': 'Email wajib diisi.',
        'email_invalid_message': 'Gunakan format email yang valid.',
        'message_required_message': 'Pesan wajib diisi.',
    },
    'project_detail': {
        'back_label': 'Projects & Skills',
        'demo_label': 'Live Demo',
        'github_label': 'GitHub',
        'about_eyebrow': 'TENTANG PROJECT',
        'about_fallback_title': 'Detail, keputusan, dan hasil project.',
        'stack_eyebrow': 'STACK & SKILLS',
        'category_label': 'Category',
        'skills_label': 'Skills',
        'architecture_eyebrow': 'SYSTEM ARCHITECTURE / FLOW',
        'architecture_title': 'Alur & Arsitektur Teknis',
        'gallery_eyebrow': 'PROJECT GALLERY',
        'gallery_title': 'Dokumentasi visual',
        'gallery_empty_title': 'Galeri belum tersedia',
        'gallery_empty_message': 'Project ini belum memiliki dokumentasi visual tambahan.',
    },
    'resume': {
        'eyebrow': 'CURRICULUM VITAE / RESUME',
        'title_template': '{name} — Engineer Profile',
        'tag': 'FULL-STACK & IOT ENGINEER',
        'version': 'PDF VERSION 2026.1',
        'description': 'Ringkasan kualifikasi teknis, pengalaman proyek, arsitektur backend, dan rekayasa sistem IoT.',
        'highlights': [
            {'label': 'PENDIDIKAN', 'value': 'Teknik Komputer / Computer Engineering'},
            {'label': 'DISIPLIN', 'value': 'Full-Stack, REST API, ESP32 / IoT'},
            {'label': 'FORMAT', 'value': 'Dokumen PDF Siap Cetak'},
        ],
        'download_label': 'Unduh CV (PDF) ↓',
        'close_label': 'Tutup',
        'fallback_cv_url': '/Marshel_CV_Fullstack_IoT.pdf',
        'download_filename': 'Marshel_CV_Engineer.pdf',
    },
}


def _merge_with_defaults(defaults, saved):
    if isinstance(defaults, dict):
        saved_dict = saved if isinstance(saved, dict) else {}
        return {
            key: _merge_with_defaults(value, saved_dict.get(key))
            for key, value in defaults.items()
        }
    if isinstance(defaults, list):
        return saved if isinstance(saved, list) else deepcopy(defaults)
    return saved if saved is not None else deepcopy(defaults)


def get_site_content():
    record = db.session.get(SiteContent, 1)
    content = _merge_with_defaults(DEFAULT_SITE_CONTENT, record.content if record else {})
    return {
        'id': 1,
        'content': content,
        'created_at': record.created_at.isoformat() if record and record.created_at else None,
        'updated_at': record.updated_at.isoformat() if record and record.updated_at else None,
    }


def update_site_content(content):
    record = db.session.get(SiteContent, 1)
    if not record:
        record = SiteContent(id=1, content={})
        db.session.add(record)

    record.content = _merge_with_defaults(DEFAULT_SITE_CONTENT, content)
    db.session.commit()
    return get_site_content()
