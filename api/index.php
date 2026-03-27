<?php

// Vercel Serverless Function entry point
// Redireciona o tráfego de /api para o subdiretório backend/public/index.php

require __DIR__ . '/../backend/public/index.php';
