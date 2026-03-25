import { NextRequest, NextResponse } from 'next/server';
import { getOsSessionCookieName, verifyOsSessionToken } from '@/lib/os/server/session-token';

const SAFE_DEFAULT_OVERVIEW = {
    stats: {
        total_orders: 0,
        confirmed: 0,
        delivered: 0,
        canceled: 0,
        revenue: 0,
        orders_per_hour: [],
        top_cities: [],
        top_perfumes: [],
        source_breakdown: {},
    },
    recentOrders: [],
    todayRevenue: 0,
    todayOrders: 0,
    avgBasket: 0,
    confirmationRate: 0,
    lowStockAlerts: [],
};

const SAFE_DEFAULT_SETTINGS = {
    shop_name: 'ELIE PERFUMES',
    support_email: 'contact@elie.ma',
    whatsapp: '+212 600 000 000',
    auto_validate: false,
    low_stock_alert: true,
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
};

const SAFE_DEFAULT_PREFERENCES = {
    userId: 'operator:default',
    warRoomMode: 'auto',
    notifications: {
        toastsEnabled: true,
        soundsEnabled: false,
        refreshIntervalSec: 30,
        slaWarningMinutes: 45,
        categoriesEnabled: {
            orders: true,
            stock: true,
            business: true,
            operators: true,
            system: true,
        },
    },
    dashboard: {
        defaultPeriodDays: 30,
        widgets: ['overview', 'pipeline', 'sources', 'low_stock'],
        savedViews: [],
    },
    mobile: {
        density: 'compact',
    },
    operations: {
        highValueThreshold: 700,
        slaTargetMinutes: 30,
    },
    updatedAt: new Date(0).toISOString(),
    metadata: {},
};

function buildSafeTrackingSnapshot() {
    return {
        metrics: [],
        sourceBreakdown: { id: 'source', title: '', description: '', rows: [] },
        cityBreakdown: { id: 'city', title: '', description: '', rows: [] },
        productBreakdown: { id: 'product', title: '', description: '', rows: [] },
        statusBreakdown: { id: 'status', title: '', description: '', rows: [] },
        temporalBreakdown: { id: 'temporal', title: '', description: '', rows: [] },
        funnel: [],
        topCities: [],
        topProducts: [],
        topSources: [],
        topCustomerSegments: [],
        narratives: [],
        hourlyHeatmap: [],
    };
}

function buildSafeAnalyticsDashboardPayload() {
    const generatedAt = new Date().toISOString();
    return {
        snapshot: {
            periodDays: 30,
            generatedAt,
            totals: {
                orders: 0,
                confirmations: 0,
                confirmationRate: 0,
                cancellations: 0,
                estimatedRevenue: 0,
                averageBasket: 0,
                averageConfirmationDelayMinutes: 0,
                averageProcessingDelayMinutes: 0,
                recurringCustomers: 0,
            },
            ordersByDay: [],
            sourcePerformance: [],
            cityPerformance: [],
            productPerformance: [],
            packPerformance: [],
            topPerformers: [],
            funnel: [],
            customerLtv: {
                average: 0,
                total: 0,
                highValueCustomers: 0,
            },
        },
        overview: SAFE_DEFAULT_OVERVIEW,
    };
}

function buildSafeTrackingPayload() {
    return {
        snapshot: {
            periodDays: 30,
            generatedAt: new Date().toISOString(),
            snapshot: buildSafeTrackingSnapshot(),
        },
    };
}

function buildSafeIntelligencePayload() {
    return {
        snapshot: {
            periodDays: 30,
            generatedAt: new Date().toISOString(),
            summary: {
                totalInsights: 0,
                urgentCount: 0,
                opportunityCount: 0,
                riskCount: 0,
                growthCount: 0,
                retentionCount: 0,
                headline: 'Aucun insight disponible',
            },
            insights: [],
            groupedInsights: {
                urgent: [],
                opportunity: [],
                risk: [],
                growth: [],
                retention: [],
            },
            signals: [],
        },
    };
}

function buildSafeOsApiFallback(request: NextRequest): NextResponse | null {
    if (request.method !== 'GET') return null;

    const { pathname } = request.nextUrl;
    if (pathname === '/api/os/orders') {
        const rawPage = Number(request.nextUrl.searchParams.get('page') ?? '1');
        const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? '50');
        const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
        const pageSize = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(50, Math.floor(rawLimit)) : 50;
        return NextResponse.json({ orders: [], page, total: 0, pageSize, hasMore: false }, { status: 200 });
    }
    if (pathname === '/api/os/events') {
        return NextResponse.json({ events: [], nextCursor: null }, { status: 200 });
    }
    if (pathname === '/api/os/overview') {
        return NextResponse.json(SAFE_DEFAULT_OVERVIEW, { status: 200 });
    }
    if (pathname === '/api/os/catalog') {
        return NextResponse.json({ products: [] }, { status: 200 });
    }
    if (pathname === '/api/os/search') {
        return NextResponse.json({ results: [] }, { status: 200 });
    }
    if (pathname === '/api/os/audit') {
        return NextResponse.json({ entries: [] }, { status: 200 });
    }
    if (pathname === '/api/os/preferences') {
        return NextResponse.json({ preferences: SAFE_DEFAULT_PREFERENCES }, { status: 200 });
    }
    if (pathname === '/api/os/settings') {
        return NextResponse.json({ settings: SAFE_DEFAULT_SETTINGS, configured: false }, { status: 200 });
    }
    if (pathname === '/api/os/analytics/dashboard') {
        return NextResponse.json(buildSafeAnalyticsDashboardPayload(), { status: 200 });
    }
    if (pathname === '/api/os/analytics/tracking') {
        return NextResponse.json(buildSafeTrackingPayload(), { status: 200 });
    }
    if (pathname === '/api/os/analytics/intelligence') {
        return NextResponse.json(buildSafeIntelligencePayload(), { status: 200 });
    }

    return null;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isOsPage = pathname.startsWith('/os');
    const isOsApi = pathname.startsWith('/api/os');

    // Protect OS pages and OS API routes.
    if (!isOsPage && !isOsApi) {
        return NextResponse.next();
    }

    // Allow login page and auth API routes through
    if (pathname === '/os/login' || pathname.startsWith('/os/login/')) {
        return NextResponse.next();
    }
    if (pathname.startsWith('/api/os/auth/')) {
        return NextResponse.next();
    }

    const token = request.cookies.get(getOsSessionCookieName())?.value ?? null;
    const secret = process.env.ELIE_OS_SECRET;

    if (!secret) {
        console.error('[Middleware] ELIE_OS_SECRET not configured.');
        if (isOsApi) {
            const safeFallback = buildSafeOsApiFallback(request);
            if (safeFallback) return safeFallback;
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        return NextResponse.redirect(new URL('/os/login', request.url));
    }

    const session = await verifyOsSessionToken({ secret, token });
    if (!session) {
        if (isOsApi) {
            const safeFallback = buildSafeOsApiFallback(request);
            if (safeFallback) return safeFallback;
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const loginUrl = new URL('/os/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/os/:path*', '/api/os/:path*'],
};
