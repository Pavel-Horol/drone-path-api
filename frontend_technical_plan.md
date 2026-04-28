# FRONTEND TECHNICAL PLAN - DRONE PATH MANAGEMENT

## ОБЗОР ПРОЕКТА

**Цель:** Создать современное веб-приложение для управления дронами и их маршрутами с интерактивными картами и загрузкой фотографий.

**Backend API:** Node.js + Express + MongoDB
**Frontend Stack:** Nuxt 3 + Vue 3 + PrimeVue + Leaflet

---

## ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Core Technologies
- **Nuxt 3** - Meta-framework для Vue.js с SSR/SPA
- **Vue 3** с Composition API и `<script setup>`
- **TypeScript** - для типизации
- **PrimeVue 3** - UI библиотека компонентов
- **Pinia** - state management с persistance

### Дополнительные библиотеки
- **Leaflet** + **vue3-leaflet** - интерактивные карты
- **VueUse** - collection of utility composables
- **@vuelidate/core** - валидация форм
- **@nuxtjs/google-fonts** - веб-шрифты
- **@pinia-plugin-persistedstate** - сохранение состояния в localStorage

### Development Tools
- **Vite** - build tool (встроен в Nuxt 3)
- **ESLint** + **Prettier** - код quality
- **Vitest** - unit testing

---

## АРХИТЕКТУРА ПРИЛОЖЕНИЯ

### Структура проекта
```
frontend/
├── components/
│   ├── UI/                    # Переиспользуемые UI компоненты
│   ├── Layout/                # Layout компоненты
│   ├── Drone/                 # Компоненты для дронов
│   ├── Route/                 # Компоненты для маршрутов
│   └── Map/                   # Компоненты карты
├── pages/                     # Страницы приложения (автороутинг)
├── stores/                    # Pinia stores
├── composables/               # Переиспользуемая логика
├── middleware/                # Middleware для роутинга
├── plugins/                   # Nuxt plugins
├── types/                     # TypeScript типы
├── utils/                     # Утилиты
└── assets/                    # Статические файлы
```

---

## API INTEGRATION

### Backend Endpoints Analysis

#### Authentication Endpoints
```typescript
// POST /api/v1/auth/register
interface RegisterRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  status: 'success';
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
}

// POST /api/v1/auth/login
interface LoginRequest {
  username: string;
  password: string;
}
// Response: AuthResponse

// GET /api/v1/auth/profile
interface ProfileResponse {
  status: 'success';
  data: {
    user: User;
  };
}
```

#### Drones Endpoints
```typescript
// GET /api/v1/drones
interface DroneListResponse {
  _id: string;
  model: string;
  serialNumber: string;
  currentBatteryCharge: number;
  totalFlightTime: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}[]

// GET /api/v1/drones/:id
interface DroneDetailResponse {
  _id: string;
  model: string;
  serialNumber: string;
  currentBatteryCharge: number;
  totalFlightTime: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  routes: {
    _id: string;
    name: string;
    status: 'processing' | 'partial' | 'complete';
    totalPoints: number;
    pointsWithPhotos: number;
    createdAt: string;
  }[];
}

// POST /api/v1/drones
interface CreateDroneRequest {
  model: string;
  serialNumber: string;
  currentBatteryCharge?: number; // default: 100
  totalFlightTime?: number; // default: 0
}

interface CreateDroneResponse {
  id: string;
  model: string;
  serialNumber: string;
  currentBatteryCharge: number;
  totalFlightTime: number;
  createdAt: string;
}

// PUT /api/v1/drones/:id
interface UpdateDroneRequest {
  model?: string;
  currentBatteryCharge?: number; // 0-100
  totalFlightTime?: number; // >= 0
}
// Response: CreateDroneResponse + updatedAt

// DELETE /api/v1/drones/:id
interface DeleteDroneResponse {
  message: string;
  deletedDrone: {
    id: string;
    model: string;
    serialNumber: string;
  };
}

// POST /api/v1/drones/:droneId/assign-route/:routeId
interface AssignDroneResponse {
  message: string;
  route: {
    id: string;
    name: string;
    droneId: string;
    status: string;
    totalPoints: number;
    pointsWithPhotos: number;
  };
  drone: {
    id: string;
    model: string;
    serialNumber: string;
  };
}
```

#### Routes Endpoints
```typescript
// GET /api/v1/routes
interface RouteListResponse {
  _id: string;
  name: string;
  droneId?: string;
  userId: string;
  status: 'processing' | 'partial' | 'complete';
  totalPoints: number;
  pointsWithPhotos: number;
  createdAt: string;
  updatedAt: string;
}[]

// GET /api/v1/routes/:id
interface RouteDetailResponse {
  id: string;
  name: string;
  droneId?: string;
  status: 'processing' | 'partial' | 'complete';
  totalPoints: number;
  pointsWithPhotos: number;
  createdAt: string;
  updatedAt: string;
  points: RoutePoint[];
}

interface RoutePoint {
  fileName: string;
  date: string;
  time: string;
  latitude: string;
  longitude: string;
  altitude?: string;
  speed?: string;
  course?: string;
  sensorData: {
    aex?: string;
    spp?: string;
    srr?: string;
    mLux?: string;
    rIr1?: string;
    gIr?: string;
    rIr2?: string;
    iIr?: string;
    iBright?: string;
    shutter?: string;
    gain?: string;
  };
  hasPhoto: boolean;
  photoUrl?: string;
}

// POST /api/v1/routes (multipart/form-data)
interface CreateRouteRequest {
  name?: string;
  csv: File; // Required CSV file
  photos?: File[]; // Optional photo files
}

interface CreateRouteResponse {
  route: RouteDetailResponse;
  missingPhotos: string[]; // Array of missing photo filenames
}

// POST /api/v1/routes/:id/photos (multipart/form-data)
interface UploadPhotosRequest {
  photos: File[]; // Array of photo files
}

interface UploadPhotosResponse {
  id: string;
  status: string;
  totalPoints: number;
  pointsWithPhotos: number;
  newPhotosAdded: number;
  stillMissingPhotos: string[];
}
```

---

## ДЕТАЛЬНОЕ ОПИСАНИЕ СТРАНИЦ

### 1. Authentication Pages

#### `/login` - Login Page
**Описание:** Страница входа с сохранением JWT токена
**Компоненты:** Card, InputText, Password, Button
**Валидация:** 
- username: required
- password: required, min 6 characters
**Функциональность:**
- Форма логина с валидацией в реальном времени
- Сохранение токена в localStorage при успешном входе
- Редирект на Dashboard после входа
- Ссылка на регистрацию

```vue
<!-- pages/login.vue -->
<template>
  <div class="flex align-items-center justify-content-center min-h-screen bg-surface-50">
    <Card class="w-full max-w-md">
      <template #header>
        <div class="text-center p-4">
          <img src="/logo.png" alt="Logo" class="h-3rem mb-3">
          <h1 class="text-3xl font-bold text-900 mb-2">Welcome Back</h1>
          <p class="text-600">Sign in to your account</p>
        </div>
      </template>
      
      <template #content>
        <form @submit.prevent="handleLogin" class="p-4">
          <div class="field mb-4">
            <label for="username" class="block text-900 font-medium mb-2">Username</label>
            <InputText 
              id="username"
              v-model="form.username"
              placeholder="Enter your username"
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
              autofocus
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
          </div>

          <div class="field mb-4">
            <label for="password" class="block text-900 font-medium mb-2">Password</label>
            <Password 
              v-model="form.password"
              placeholder="Enter your password"
              :feedback="false"
              toggle-mask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <Button 
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            class="w-full mb-4"
            :loading="loading"
          />
        </form>
      </template>
      
      <template #footer>
        <div class="text-center p-4">
          <span class="text-600">Don't have an account? </span>
          <NuxtLink to="/register" class="text-primary font-medium hover:underline">
            Create one here
          </NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const { login } = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const loading = ref(false)

const validateForm = () => {
  errors.username = form.username ? '' : 'Username is required'
  errors.password = form.password ? '' : 'Password is required'
  
  if (form.password && form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  return !errors.username && !errors.password
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    await login(form)
    await router.push('/')
  } catch (error) {
    // Handle login error
  } finally {
    loading.value = false
  }
}
</script>
```

#### `/register` - Registration Page
**Аналогично login, но с дополнительным полем confirmPassword**

### 2. Main Layout

#### `layouts/default.vue` - Main Application Layout
**Описание:** Основной layout с навигацией и header
**Компоненты:** Menubar, PanelMenu, Avatar, Button

```vue
<!-- layouts/default.vue -->
<template>
  <div class="layout-wrapper">
    <!-- Top Menubar -->
    <Menubar :model="menuItems" class="layout-topbar">
      <template #start>
        <NuxtLink to="/" class="flex align-items-center text-decoration-none">
          <img src="/logo.png" alt="Drone Path" class="h-2rem mr-2">
          <span class="text-xl font-bold text-primary">Drone Path</span>
        </NuxtLink>
      </template>
      
      <template #end>
        <div class="flex align-items-center gap-2">
          <!-- User Profile -->
          <Chip :label="user?.username" class="bg-primary text-0" />
          
          <!-- Profile Menu -->
          <Menu ref="profileMenu" :model="profileMenuItems" popup />
          <Button 
            icon="pi pi-user"
            severity="secondary"
            text
            rounded
            @click="$refs.profileMenu.toggle($event)"
          />
        </div>
      </template>
    </Menubar>

    <!-- Main Layout -->
    <div class="layout-main">
      <!-- Sidebar -->
      <aside class="layout-sidebar">
        <PanelMenu :model="sidebarItems" class="w-full border-none sidebar-menu" />
      </aside>

      <!-- Content Area -->
      <main class="layout-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuthStore()

const menuItems = computed(() => [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    to: '/'
  },
  {
    label: 'Drones',
    icon: 'pi pi-cog',
    to: '/drones'
  },
  {
    label: 'Routes',
    icon: 'pi pi-map',
    to: '/routes'
  }
])

const sidebarItems = computed(() => [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    to: '/',
    class: 'sidebar-item'
  },
  {
    label: 'Drones',
    icon: 'pi pi-cog',
    items: [
      { label: 'All Drones', icon: 'pi pi-list', to: '/drones' },
      { label: 'Add New', icon: 'pi pi-plus', to: '/drones/create' }
    ]
  },
  {
    label: 'Routes',
    icon: 'pi pi-map',
    items: [
      { label: 'All Routes', icon: 'pi pi-list', to: '/routes' },
      { label: 'Create New', icon: 'pi pi-plus', to: '/routes/create' }
    ]
  }
])

const profileMenuItems = computed(() => [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    to: '/profile'
  },
  {
    separator: true
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => logout()
  }
])
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main {
  display: flex;
  flex: 1;
}

.layout-sidebar {
  width: 280px;
  background: var(--surface-50);
  border-right: 1px solid var(--surface-200);
}

.layout-content {
  flex: 1;
  padding: 1.5rem;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .layout-sidebar {
    display: none; /* Implement mobile navigation */
  }
}
</style>
```

### 3. Dashboard Page

#### `/` - Dashboard
**Описание:** Главная страница с overview и быстрыми действиями

```vue
<!-- pages/index.vue -->
<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-center mb-4 gap-3">
      <div>
        <h1 class="text-4xl font-bold text-900 m-0 mb-2">Dashboard</h1>
        <p class="text-600 m-0">Welcome back, {{ user?.username }}!</p>
      </div>
      
      <div class="flex gap-2">
        <Button 
          label="Add Drone" 
          icon="pi pi-plus" 
          @click="$router.push('/drones/create')"
        />
        <Button 
          label="Create Route" 
          icon="pi pi-map-marker" 
          severity="secondary"
          @click="$router.push('/routes/create')"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid mb-4">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round shadow-2 text-center">
          <div class="text-6xl text-blue-500 mb-3">
            <i class="pi pi-desktop"></i>
          </div>
          <div class="text-2xl font-bold text-900 mb-2">{{ stats.totalDrones }}</div>
          <div class="text-600">Total Drones</div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round shadow-2 text-center">
          <div class="text-6xl text-green-500 mb-3">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="text-2xl font-bold text-900 mb-2">{{ stats.activeDrones }}</div>
          <div class="text-600">Active Drones</div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round shadow-2 text-center">
          <div class="text-6xl text-purple-500 mb-3">
            <i class="pi pi-map"></i>
          </div>
          <div class="text-2xl font-bold text-900 mb-2">{{ stats.totalRoutes }}</div>
          <div class="text-600">Total Routes</div>
        </div>
      </div>
      
      <div class="col-12 md:col-6 lg:col-3">
        <div class="surface-card p-4 border-round shadow-2 text-center">
          <div class="text-6xl text-orange-500 mb-3">
            <i class="pi pi-images"></i>
          </div>
          <div class="text-2xl font-bold text-900 mb-2">{{ stats.totalPhotos }}</div>
          <div class="text-600">Photos Captured</div>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid">
      <!-- Recent Routes -->
      <div class="col-12 lg:col-8">
        <div class="surface-card p-4 border-round shadow-2">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="text-xl font-bold text-900 m-0">Recent Routes</h3>
            <Button 
              label="View All" 
              link 
              @click="$router.push('/routes')"
            />
          </div>
          
          <DataTable 
            :value="recentRoutes" 
            :rows="5"
            responsive-layout="scroll"
            class="p-datatable-sm"
          >
            <Column field="name" header="Name" />
            
            <Column field="status" header="Status">
              <template #body="{ data }">
                <Tag 
                  :value="data.status" 
                  :severity="getStatusSeverity(data.status)" 
                />
              </template>
            </Column>
            
            <Column header="Progress">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <ProgressBar 
                    :value="(data.pointsWithPhotos / data.totalPoints) * 100" 
                    class="flex-1 h-0.5rem"
                  />
                  <small class="text-600">
                    {{ data.pointsWithPhotos }}/{{ data.totalPoints }}
                  </small>
                </div>
              </template>
            </Column>
            
            <Column header="Actions">
              <template #body="{ data }">
                <Button 
                  icon="pi pi-eye" 
                  size="small" 
                  text
                  @click="$router.push(`/routes/${data._id}`)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Recent Drones -->
      <div class="col-12 lg:col-4">
        <div class="surface-card p-4 border-round shadow-2">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="text-xl font-bold text-900 m-0">Recent Drones</h3>
            <Button 
              label="View All" 
              link 
              @click="$router.push('/drones')"
            />
          </div>
          
          <div class="flex flex-column gap-3">
            <div 
              v-for="drone in recentDrones" 
              :key="drone._id"
              class="flex align-items-center justify-content-between p-3 border-round hover:surface-hover cursor-pointer"
              @click="$router.push(`/drones/${drone._id}`)"
            >
              <div class="flex align-items-center gap-3">
                <Avatar icon="pi pi-desktop" />
                <div>
                  <div class="font-medium text-900">{{ drone.model }}</div>
                  <div class="text-sm text-600">{{ drone.serialNumber }}</div>
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-sm text-900 font-medium">
                  {{ drone.currentBatteryCharge }}%
                </div>
                <ProgressBar 
                  :value="drone.currentBatteryCharge" 
                  class="w-4rem h-0.5rem"
                  :pt="{ value: { style: getbatteryColor(drone.currentBatteryCharge) } }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useAuthStore()
const { data: dronesData } = await useFetch('/api/v1/drones')
const { data: routesData } = await useFetch('/api/v1/routes')

const stats = computed(() => {
  const drones = dronesData.value || []
  const routes = routesData.value || []
  
  return {
    totalDrones: drones.length,
    activeDrones: drones.filter(d => d.currentBatteryCharge > 20).length,
    totalRoutes: routes.length,
    totalPhotos: routes.reduce((sum, r) => sum + r.pointsWithPhotos, 0)
  }
})

const recentRoutes = computed(() => 
  (routesData.value || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
)

const recentDrones = computed(() =>
  (dronesData.value || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
)

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'complete': return 'success'
    case 'partial': return 'warning'
    case 'processing': return 'info'
    default: return 'secondary'
  }
}

const getBatteryColor = (level: number) => {
  if (level > 70) return 'background: #10b981' // green
  if (level > 30) return 'background: #f59e0b' // yellow
  return 'background: #ef4444' // red
}
</script>
```

### 4. Drone Management Pages

#### `/drones` - Drones List
```vue
<!-- pages/drones/index.vue -->
<template>
  <div class="drones-list">
    <!-- Header -->
    <div class="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-center mb-4 gap-3">
      <div>
        <h1 class="text-3xl font-bold text-900 m-0 mb-2">My Drones</h1>
        <p class="text-600 m-0">Manage your drone fleet</p>
      </div>
      
      <Button 
        label="Add New Drone" 
        icon="pi pi-plus" 
        @click="$router.push('/drones/create')"
      />
    </div>

    <!-- Filters -->
    <div class="surface-card p-4 border-round shadow-1 mb-4">
      <div class="grid">
        <div class="col-12 md:col-4">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText 
              v-model="filters.search"
              placeholder="Search by model or serial..."
              class="w-full"
            />
          </span>
        </div>
        
        <div class="col-12 md:col-4">
          <Dropdown 
            v-model="filters.batteryLevel"
            :options="batteryLevelOptions"
            option-label="label"
            option-value="value"
            placeholder="Filter by battery level"
            class="w-full"
            show-clear
          />
        </div>
        
        <div class="col-12 md:col-4">
          <Dropdown 
            v-model="filters.sortBy"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            placeholder="Sort by..."
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Drones Table -->
    <div class="surface-card border-round shadow-2">
      <DataTable 
        :value="filteredDrones"
        :paginator="true"
        :rows="10"
        :loading="pending"
        responsive-layout="scroll"
        data-key="_id"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        current-page-report-template="Showing {first} to {last} of {totalRecords} drones"
        :rows-per-page-options="[10, 20, 50]"
      >
        <template #header>
          <div class="p-4">
            <h3 class="text-xl font-bold text-900 m-0">Drone Fleet</h3>
          </div>
        </template>

        <Column field="model" header="Drone" sortable>
          <template #body="{ data }">
            <div class="flex align-items-center gap-3">
              <Avatar 
                icon="pi pi-desktop" 
                shape="circle" 
                size="large"
                :style="{ backgroundColor: getBatteryColor(data.currentBatteryCharge) }"
              />
              <div>
                <div class="font-medium text-900">{{ data.model }}</div>
                <div class="text-sm text-600">{{ data.serialNumber }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="currentBatteryCharge" header="Battery" sortable>
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <ProgressBar 
                :value="data.currentBatteryCharge"
                class="flex-1"
                :pt="{ value: { style: getBatteryColor(data.currentBatteryCharge) } }"
              />
              <span class="font-medium">{{ data.currentBatteryCharge }}%</span>
            </div>
          </template>
        </Column>

        <Column field="totalFlightTime" header="Flight Time" sortable>
          <template #body="{ data }">
            {{ formatFlightTime(data.totalFlightTime) }}
          </template>
        </Column>

        <Column field="createdAt" header="Created" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>

        <Column header="Actions" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye"
                size="small"
                severity="info"
                v-tooltip="'View Details'"
                @click="$router.push(`/drones/${data._id}`)"
              />
              <Button 
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                v-tooltip="'Edit'"
                @click="$router.push(`/drones/${data._id}/edit`)"
              />
              <Button 
                icon="pi pi-trash"
                size="small"
                severity="danger"
                v-tooltip="'Delete'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { $confirm } = useNuxtApp()
const { data: drones, pending, refresh } = await useFetch('/api/v1/drones')

// Filters
const filters = reactive({
  search: '',
  batteryLevel: null,
  sortBy: 'createdAt'
})

const batteryLevelOptions = [
  { label: 'High (70%+)', value: 'high' },
  { label: 'Medium (30-70%)', value: 'medium' },
  { label: 'Low (<30%)', value: 'low' }
]

const sortOptions = [
  { label: 'Latest First', value: 'createdAt' },
  { label: 'Model A-Z', value: 'model' },
  { label: 'Battery Level', value: 'currentBatteryCharge' },
  { label: 'Flight Time', value: 'totalFlightTime' }
]

// Computed
const filteredDrones = computed(() => {
  let filtered = [...(drones.value || [])]
  
  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(drone => 
      drone.model.toLowerCase().includes(search) ||
      drone.serialNumber.toLowerCase().includes(search)
    )
  }
  
  // Battery level filter
  if (filters.batteryLevel) {
    filtered = filtered.filter(drone => {
      switch (filters.batteryLevel) {
        case 'high': return drone.currentBatteryCharge >= 70
        case 'medium': return drone.currentBatteryCharge >= 30 && drone.currentBatteryCharge < 70
        case 'low': return drone.currentBatteryCharge < 30
        default: return true
      }
    })
  }
  
  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const field = filters.sortBy
      if (field === 'createdAt') {
        return new Date(b[field]) - new Date(a[field])
      }
      return a[field] > b[field] ? 1 : -1
    })
  }
  
  return filtered
})

// Methods
const confirmDelete = (drone) => {
  $confirm.require({
    message: `Are you sure you want to delete ${drone.model}?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteDrone(drone._id)
  })
}

const deleteDrone = async (id: string) => {
  try {
    await $fetch(`/api/v1/drones/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (error) {
    // Handle error
  }
}

const getBatteryColor = (level: number) => {
  if (level > 70) return '#10b981' // green
  if (level > 30) return '#f59e0b' // yellow
  return '#ef4444' // red
}

const formatFlightTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
```

#### `/drones/create` - Create Drone
```vue
<!-- pages/drones/create.vue -->
<template>
  <div class="drone-create">
    <div class="flex align-items-center gap-3 mb-4">
      <Button 
        icon="pi pi-arrow-left" 
        severity="secondary" 
        text 
        @click="$router.back()"
      />
      <div>
        <h1 class="text-3xl font-bold text-900 m-0">Create New Drone</h1>
        <p class="text-600 m-0">Add a new drone to your fleet</p>
      </div>
    </div>

    <div class="surface-card p-4 border-round shadow-2">
      <form @submit.prevent="handleSubmit">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="model" class="block text-900 font-medium mb-2">
                Model *
              </label>
              <InputText 
                id="model"
                v-model="form.model"
                placeholder="e.g., DJI Mavic 3"
                class="w-full"
                :class="{ 'p-invalid': errors.model }"
                autofocus
              />
              <small v-if="errors.model" class="p-error">{{ errors.model }}</small>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="serialNumber" class="block text-900 font-medium mb-2">
                Serial Number *
              </label>
              <InputText 
                id="serialNumber"
                v-model="form.serialNumber"
                placeholder="e.g., DJI001234"
                class="w-full"
                :class="{ 'p-invalid': errors.serialNumber }"
              />
              <small v-if="errors.serialNumber" class="p-error">{{ errors.serialNumber }}</small>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label class="block text-900 font-medium mb-2">
                Battery Level ({{ form.currentBatteryCharge }}%)
              </label>
              <Slider 
                v-model="form.currentBatteryCharge"
                :min="0"
                :max="100"
                class="w-full mb-2"
              />
              <InputNumber
                v-model="form.currentBatteryCharge"
                :min="0"
                :max="100"
                suffix="%"
                class="w-full"
                :use-grouping="false"
              />
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="flightTime" class="block text-900 font-medium mb-2">
                Total Flight Time (minutes)
              </label>
              <InputNumber
                id="flightTime"
                v-model="form.totalFlightTime"
                :min="0"
                class="w-full"
                placeholder="0"
                :use-grouping="false"
              />
              <small class="text-600">Leave empty for new drones</small>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <Button 
            type="submit"
            label="Create Drone"
            icon="pi pi-check"
            :loading="loading"
          />
          <Button 
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            @click="$router.push('/drones')"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const router = useRouter()

const form = reactive({
  model: '',
  serialNumber: '',
  currentBatteryCharge: 100,
  totalFlightTime: 0
})

const errors = reactive({
  model: '',
  serialNumber: ''
})

const loading = ref(false)

const validateForm = () => {
  errors.model = form.model ? '' : 'Model is required'
  errors.serialNumber = form.serialNumber ? '' : 'Serial number is required'
  
  return !errors.model && !errors.serialNumber
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    await $fetch('/api/v1/drones', {
      method: 'POST',
      body: form
    })
    
    await router.push('/drones')
  } catch (error) {
    // Handle error
  } finally {
    loading.value = false
  }
}
</script>
```

### 5. Route Management Pages

#### `/routes/[id]` - Route Detail (ГЛАВНАЯ ФИЧА)
**Описание:** Детальный просмотр маршрута с интерактивной картой

```vue
<!-- pages/routes/[id].vue -->
<template>
  <div class="route-detail">
    <!-- Header -->
    <div class="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-start mb-4 gap-3">
      <div class="flex align-items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          severity="secondary" 
          text 
          @click="$router.back()"
        />
        <div>
          <h1 class="text-3xl font-bold text-900 m-0 mb-2">{{ route?.name }}</h1>
          <div class="flex align-items-center gap-3">
            <Tag 
              :value="route?.status" 
              :severity="getStatusSeverity(route?.status)" 
            />
            <span class="text-600">{{ route?.totalPoints }} points</span>
            <span class="text-600">{{ route?.pointsWithPhotos }} with photos</span>
          </div>
        </div>
      </div>
      
      <div class="flex gap-2">
        <Button 
          label="Upload Photos"
          icon="pi pi-upload"
          severity="secondary"
          @click="showUploadDialog = true"
        />
        <Button 
          label="Edit Route"
          icon="pi pi-pencil"
          @click="$router.push(`/routes/${route._id}/edit`)"
        />
      </div>
    </div>

    <!-- Progress Stats -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="surface-card p-4 border-round text-center">
          <div class="text-2xl font-bold text-900 mb-2">
            {{ route?.pointsWithPhotos }}/{{ route?.totalPoints }}
          </div>
          <div class="text-600 mb-3">Photos Captured</div>
          <ProgressBar 
            :value="photoProgress" 
            class="h-0.5rem"
            :pt="{ value: { style: photoProgress === 100 ? 'background: #10b981' : 'background: #3b82f6' } }"
          />
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="surface-card p-4 border-round text-center">
          <div class="text-2xl font-bold text-900 mb-2">
            {{ assignedDrone ? 'Assigned' : 'Unassigned' }}
          </div>
          <div class="text-600 mb-3">Drone Status</div>
          <Chip 
            v-if="assignedDrone" 
            :label="assignedDrone.model" 
            icon="pi pi-desktop"
          />
          <span v-else class="text-400">No drone assigned</span>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="surface-card p-4 border-round text-center">
          <div class="text-2xl font-bold text-900 mb-2">
            {{ formatDate(route?.createdAt) }}
          </div>
          <div class="text-600">Created Date</div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="surface-card p-4 border-round text-center">
          <div class="text-2xl font-bold text-900 mb-2">
            {{ missingPhotos?.length || 0 }}
          </div>
          <div class="text-600">Missing Photos</div>
        </div>
      </div>
    </div>

    <!-- Main Content: Map + Point Details -->
    <div class="grid">
      <!-- Interactive Map -->
      <div class="col-12" :class="selectedPoint ? 'lg:col-8' : ''">
        <div class="surface-card border-round shadow-2" style="height: 600px;">
          <div class="p-4 border-bottom-1 surface-border">
            <div class="flex justify-content-between align-items-center">
              <h3 class="text-xl font-bold text-900 m-0">Route Map</h3>
              
              <!-- Map Controls -->
              <div class="flex gap-2">
                <Button 
                  :label="showOnlyWithPhotos ? 'All Points' : 'With Photos'"
                  :icon="showOnlyWithPhotos ? 'pi pi-eye' : 'pi pi-images'"
                  size="small"
                  severity="secondary"
                  @click="togglePhotoFilter"
                />
                <Button 
                  label="Fit Bounds"
                  icon="pi pi-search-plus"
                  size="small"
                  severity="secondary"
                  @click="fitMapToBounds"
                />
              </div>
            </div>
          </div>
          
          <div class="p-4" style="height: calc(100% - 70px);">
            <RouteMap
              :points="filteredMapPoints"
              :selected-point="selectedPoint"
              @point-selected="onPointSelected"
              @point-deselected="onPointDeselected"
              style="height: 100%;"
            />
          </div>
        </div>
      </div>

      <!-- Point Information Panel -->
      <div v-if="selectedPoint" class="col-12 lg:col-4">
        <div class="surface-card border-round shadow-2">
          <div class="p-4 border-bottom-1 surface-border">
            <div class="flex justify-content-between align-items-center">
              <h3 class="text-xl font-bold text-900 m-0">Point Details</h3>
              <Button 
                icon="pi pi-times"
                text
                rounded
                @click="selectedPoint = null"
              />
            </div>
          </div>
          
          <div class="p-4">
            <!-- Photo Preview -->
            <div class="mb-4">
              <div v-if="selectedPoint.hasPhoto" class="relative">
                <img 
                  :src="selectedPoint.photoUrl"
                  :alt="selectedPoint.fileName"
                  class="w-full border-round cursor-pointer hover:opacity-80 transition-all transition-duration-200"
                  style="aspect-ratio: 16/9; object-fit: cover;"
                  @click="showPhotoModal = true"
                />
                <div class="absolute top-0 right-0 m-2">
                  <Button 
                    icon="pi pi-search-plus"
                    size="small"
                    rounded
                    @click="showPhotoModal = true"
                  />
                </div>
              </div>
              <div v-else class="flex align-items-center justify-content-center border-2 border-dashed surface-border border-round text-600" style="height: 200px;">
                <div class="text-center">
                  <i class="pi pi-image text-4xl mb-2 block"></i>
                  <div>No photo available</div>
                </div>
              </div>
            </div>

            <!-- Basic Information -->
            <div class="grid mb-4">
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Filename</div>
                <div class="text-900">{{ selectedPoint.fileName }}</div>
              </div>
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Date & Time</div>
                <div class="text-900">{{ selectedPoint.date }} {{ selectedPoint.time }}</div>
              </div>
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Latitude</div>
                <div class="text-900 font-mono">{{ parseFloat(selectedPoint.latitude).toFixed(6) }}°</div>
              </div>
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Longitude</div>
                <div class="text-900 font-mono">{{ parseFloat(selectedPoint.longitude).toFixed(6) }}°</div>
              </div>
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Altitude</div>
                <div class="text-900">{{ selectedPoint.altitude }} m</div>
              </div>
              <div class="col-6">
                <div class="text-sm font-medium text-600 mb-1">Speed</div>
                <div class="text-900">{{ selectedPoint.speed }} m/s</div>
              </div>
            </div>

            <!-- Sensor Data -->
            <div v-if="selectedPoint.sensorData && Object.keys(selectedPoint.sensorData).length">
              <Divider />
              <h4 class="text-lg font-bold text-900 mb-3">Sensor Data</h4>
              <div class="grid">
                <div 
                  v-for="(value, key) in selectedPoint.sensorData" 
                  :key="key"
                  class="col-6 mb-2"
                >
                  <div class="text-sm font-medium text-600 mb-1">{{ formatSensorName(key) }}</div>
                  <div class="text-900 font-mono">{{ value }}</div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <Divider />
            <div class="flex gap-2">
              <Button 
                v-if="selectedPoint.hasPhoto"
                label="View Full Size"
                icon="pi pi-search-plus"
                size="small"
                class="flex-1"
                @click="showPhotoModal = true"
              />
              <Button 
                label="Copy Coords"
                icon="pi pi-copy"
                size="small"
                severity="secondary"
                class="flex-1"
                @click="copyCoordinates"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Points Data Table -->
    <div class="surface-card border-round shadow-2 mt-4">
      <div class="p-4 border-bottom-1 surface-border">
        <div class="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-center gap-3">
          <h3 class="text-xl font-bold text-900 m-0">Route Points</h3>
          
          <div class="flex gap-2">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText 
                v-model="pointsFilter"
                placeholder="Search points..."
                class="p-inputtext-sm"
              />
            </span>
            
            <ToggleButton 
              v-model="showOnlyWithPhotos"
              on-label="With Photos"
              off-label="All Points"
              on-icon="pi pi-images"
              off-icon="pi pi-list"
            />
          </div>
        </div>
      </div>
      
      <DataTable 
        :value="filteredPoints"
        :paginator="true"
        :rows="20"
        responsive-layout="scroll"
        data-key="fileName"
        :selection="selectedPoint"
        selection-mode="single"
        @row-select="onRowSelect"
        @row-unselect="onRowUnselect"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        current-page-report-template="Showing {first} to {last} of {totalRecords} points"
        :rows-per-page-options="[20, 50, 100]"
      >
        <Column selection-mode="single" header-style="width: 3rem"></Column>
        
        <Column field="fileName" header="File" sortable>
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <i 
                :class="data.hasPhoto ? 'pi pi-image text-green-500' : 'pi pi-image text-400'"
                v-tooltip="data.hasPhoto ? 'Photo available' : 'Photo missing'"
              ></i>
              <span class="font-medium">{{ data.fileName }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="time" header="Time" sortable />
        
        <Column field="latitude" header="Latitude" sortable>
          <template #body="{ data }">
            <span class="font-mono">{{ parseFloat(data.latitude).toFixed(6) }}°</span>
          </template>
        </Column>
        
        <Column field="longitude" header="Longitude" sortable>
          <template #body="{ data }">
            <span class="font-mono">{{ parseFloat(data.longitude).toFixed(6) }}°</span>
          </template>
        </Column>
        
        <Column field="altitude" header="Altitude" sortable>
          <template #body="{ data }">
            {{ data.altitude }} m
          </template>
        </Column>
        
        <Column field="speed" header="Speed" sortable>
          <template #body="{ data }">
            {{ data.speed }} m/s
          </template>
        </Column>
        
        <Column field="hasPhoto" header="Photo" sortable>
          <template #body="{ data }">
            <Tag 
              :value="data.hasPhoto ? 'Available' : 'Missing'"
              :severity="data.hasPhoto ? 'success' : 'warning'"
            />
          </template>
        </Column>
        
        <Column header="Actions">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button 
                icon="pi pi-map-marker"
                size="small"
                v-tooltip="'Show on Map'"
                @click="focusPointOnMap(data)"
              />
              <Button 
                v-if="data.hasPhoto"
                icon="pi pi-eye"
                size="small"
                severity="secondary"
                v-tooltip="'View Photo'"
                @click="viewPointPhoto(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Photo Upload Dialog -->
    <Dialog 
      v-model:visible="showUploadDialog"
      header="Upload Missing Photos"
      :style="{ width: '60vw' }"
      :modal="true"
      :draggable="false"
      :resizable="false"
    >
      <RoutePhotoUpload 
        :route-id="route?._id"
        :missing-photos="missingPhotos"
        @upload-complete="onPhotosUploaded"
        @close="showUploadDialog = false"
      />
    </Dialog>

    <!-- Full Size Photo Modal -->
    <Dialog 
      v-model:visible="showPhotoModal"
      header="Photo Viewer"
      :style="{ width: '90vw', height: '90vh' }"
      :modal="true"
      :maximizable="true"
    >
      <div class="flex justify-content-center align-items-center h-full">
        <img 
          v-if="selectedPoint?.photoUrl"
          :src="selectedPoint.photoUrl"
          :alt="selectedPoint.fileName"
          class="max-w-full max-h-full"
          style="object-fit: contain;"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-content-between align-items-center">
          <span class="text-600">{{ selectedPoint?.fileName }}</span>
          <div class="flex gap-2">
            <Button 
              label="Download"
              icon="pi pi-download"
              @click="downloadPhoto"
            />
            <Button 
              label="Close"
              severity="secondary"
              @click="showPhotoModal = false"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()

// Data fetching
const { data: routeData, pending } = await useFetch(`/api/v1/routes/${route.params.id}`)

const route = computed(() => routeData.value)
const assignedDrone = computed(() => {
  // Get drone info if assigned
  return null // TODO: Fetch drone data if droneId exists
})

// Reactive state
const selectedPoint = ref(null)
const showUploadDialog = ref(false)
const showPhotoModal = ref(false)
const showOnlyWithPhotos = ref(false)
const pointsFilter = ref('')

// Computed
const photoProgress = computed(() => {
  if (!route.value) return 0
  return Math.round((route.value.pointsWithPhotos / route.value.totalPoints) * 100)
})

const missingPhotos = computed(() => {
  if (!route.value?.points) return []
  return route.value.points
    .filter(point => !point.hasPhoto)
    .map(point => point.fileName)
})

const filteredMapPoints = computed(() => {
  if (!route.value?.points) return []
  return showOnlyWithPhotos.value 
    ? route.value.points.filter(point => point.hasPhoto)
    : route.value.points
})

const filteredPoints = computed(() => {
  let points = route.value?.points || []
  
  // Filter by search
  if (pointsFilter.value) {
    const search = pointsFilter.value.toLowerCase()
    points = points.filter(point => 
      point.fileName.toLowerCase().includes(search)
    )
  }
  
  // Filter by photo availability
  if (showOnlyWithPhotos.value) {
    points = points.filter(point => point.hasPhoto)
  }
  
  return points
})

// Methods
const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'complete': return 'success'
    case 'partial': return 'warning'
    case 'processing': return 'info'
    default: return 'secondary'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatSensorName = (key: string) => {
  const nameMap = {
    aex: 'AEX',
    spp: 'SPP', 
    srr: 'SRR',
    mLux: 'mLux',
    rIr1: 'Red IR1',
    gIr: 'Green IR',
    rIr2: 'Red IR2',
    iIr: 'IR',
    iBright: 'Brightness',
    shutter: 'Shutter',
    gain: 'Gain'
  }
  return nameMap[key] || key.toUpperCase()
}

const onPointSelected = (point) => {
  selectedPoint.value = point
}

const onPointDeselected = () => {
  selectedPoint.value = null
}

const onRowSelect = (event) => {
  selectedPoint.value = event.data
}

const onRowUnselect = () => {
  selectedPoint.value = null
}

const togglePhotoFilter = () => {
  showOnlyWithPhotos.value = !showOnlyWithPhotos.value
}

const fitMapToBounds = () => {
  // TODO: Implement map bounds fitting
}

const focusPointOnMap = (point) => {
  selectedPoint.value = point
  // TODO: Focus map on point
}

const viewPointPhoto = (point) => {
  selectedPoint.value = point
  showPhotoModal.value = true
}

const copyCoordinates = async () => {
  if (!selectedPoint.value) return
  
  const coords = `${selectedPoint.value.latitude}, ${selectedPoint.value.longitude}`
  
  try {
    await navigator.clipboard.writeText(coords)
    // Show success toast
  } catch (error) {
    // Show error toast
  }
}

const downloadPhoto = () => {
  if (!selectedPoint.value?.photoUrl) return
  
  const link = document.createElement('a')
  link.href = selectedPoint.value.photoUrl
  link.download = selectedPoint.value.fileName
  link.click()
}

const onPhotosUploaded = () => {
  showUploadDialog.value = false
  // Refresh route data
  refresh()
}
</script>
```

### 6. Map Component

#### `components/Map/RouteMap.vue` - Interactive Map Component
```vue
<!-- components/Map/RouteMap.vue -->
<template>
  <div class="route-map">
    <LMap
      ref="map"
      :zoom="13"
      :center="mapCenter"
      :options="mapOptions"
      style="height: 100%; width: 100%;"
      @ready="onMapReady"
    >
      <!-- Tile Layer -->
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <!-- Route Path -->
      <LPolyline 
        v-if="routePath.length > 0"
        :lat-lngs="routePath"
        :color="'#3b82f6'"
        :weight="3"
        :opacity="0.7"
      />
      
      <!-- Point Markers -->
      <LMarker
        v-for="(point, index) in points"
        :key="point.fileName"
        :lat-lng="[parseFloat(point.latitude), parseFloat(point.longitude)]"
        @click="selectPoint(point)"
      >
        <LIcon
          :icon-url="getMarkerIcon(point)"
          :icon-size="[25, 25]"
          :icon-anchor="[12, 12]"
        />
        
        <LPopup>
          <div class="point-popup">
            <div class="font-medium mb-2">{{ point.fileName }}</div>
            <div class="text-sm mb-1">{{ point.date }} {{ point.time }}</div>
            <div class="text-sm mb-1">
              {{ parseFloat(point.latitude).toFixed(6) }}, 
              {{ parseFloat(point.longitude).toFixed(6) }}
            </div>
            <div class="flex align-items-center gap-2">
              <Tag 
                :value="point.hasPhoto ? 'Photo Available' : 'No Photo'"
                :severity="point.hasPhoto ? 'success' : 'warning'"
                size="small"
              />
            </div>
          </div>
        </LPopup>
      </LMarker>
      
      <!-- Selected Point Highlight -->
      <LCircleMarker
        v-if="selectedPoint"
        :lat-lng="[parseFloat(selectedPoint.latitude), parseFloat(selectedPoint.longitude)]"
        :radius="15"
        :color="'#f59e0b'"
        :weight="3"
        :fill="false"
      />
    </LMap>
  </div>
</template>

<script setup lang="ts">
import { 
  LMap, 
  LTileLayer, 
  LMarker, 
  LIcon, 
  LPopup, 
  LPolyline, 
  LCircleMarker 
} from '@vue-leaflet/vue-leaflet'

interface RoutePoint {
  fileName: string
  latitude: string
  longitude: string
  date: string
  time: string
  hasPhoto: boolean
}

interface Props {
  points: RoutePoint[]
  selectedPoint: RoutePoint | null
}

interface Emits {
  (e: 'point-selected', point: RoutePoint): void
  (e: 'point-deselected'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const map = ref(null)

// Computed
const mapCenter = computed(() => {
  if (props.points.length === 0) return [50.4501, 30.5234] // Default to Kyiv
  
  const latitudes = props.points.map(p => parseFloat(p.latitude))
  const longitudes = props.points.map(p => parseFloat(p.longitude))
  
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2
  const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2
  
  return [centerLat, centerLng]
})

const routePath = computed(() => {
  return props.points.map(point => [
    parseFloat(point.latitude), 
    parseFloat(point.longitude)
  ])
})

const mapOptions = {
  zoomControl: true,
  attributionControl: true
}

// Methods
const selectPoint = (point: RoutePoint) => {
  emit('point-selected', point)
}

const getMarkerIcon = (point: RoutePoint) => {
  // Return different icons based on photo availability
  const baseUrl = '/icons'
  const isSelected = props.selectedPoint?.fileName === point.fileName
  
  if (isSelected) {
    return `${baseUrl}/marker-selected.png`
  }
  
  return point.hasPhoto 
    ? `${baseUrl}/marker-with-photo.png`
    : `${baseUrl}/marker-no-photo.png`
}

const onMapReady = () => {
  nextTick(() => {
    fitBounds()
  })
}

const fitBounds = () => {
  if (!map.value || props.points.length === 0) return
  
  const group = new L.FeatureGroup(
    props.points.map(point => 
      L.marker([parseFloat(point.latitude), parseFloat(point.longitude)])
    )
  )
  
  map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
}

// Watch for points changes
watch(() => props.points, () => {
  nextTick(() => {
    fitBounds()
  })
}, { immediate: true })

// Expose methods to parent
defineExpose({
  fitBounds
})
</script>

<style scoped>
.route-map {
  height: 100%;
  width: 100%;
}

.point-popup {
  min-width: 200px;
}

/* Override Leaflet styles */
:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 12px;
}
</style>
```

---

## STORES (PINIA)

### Authentication Store
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  // Actions
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await $fetch<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response.status === 'success') {
        token.value = response.data.token
        user.value = response.data.user
        
        // Save to localStorage
        if (process.client) {
          localStorage.setItem('auth-token', token.value)
        }
        
        // Set default Authorization header
        await setAuthHeader(token.value)
      }
    } catch (error) {
      throw error
    }
  }
  
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      const response = await $fetch<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: userData
      })
      
      if (response.status === 'success') {
        token.value = response.data.token
        user.value = response.data.user
        
        // Save to localStorage
        if (process.client) {
          localStorage.setItem('auth-token', token.value)
        }
        
        await setAuthHeader(token.value)
      }
    } catch (error) {
      throw error
    }
  }
  
  const logout = async () => {
    token.value = null
    user.value = null
    
    if (process.client) {
      localStorage.removeItem('auth-token')
    }
    
    await navigateTo('/login')
  }
  
  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await $fetch<ProfileResponse>('/api/v1/auth/profile', {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`
        }
      })
      
      if (response.status === 'success') {
        token.value = tokenToValidate
        user.value = response.data.user
        await setAuthHeader(tokenToValidate)
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }
  
  const initializeAuth = async () => {
    if (process.client) {
      const savedToken = localStorage.getItem('auth-token')
      if (savedToken) {
        const isValid = await validateToken(savedToken)
        if (!isValid) {
          localStorage.removeItem('auth-token')
        }
      }
    }
  }
  
  return {
    // State
    user: readonly(user),
    token: readonly(token),
    
    // Getters
    isLoggedIn,
    
    // Actions
    login,
    register,
    logout,
    validateToken,
    initializeAuth
  }
}, {
  persist: {
    storage: persistedState.localStorage,
    paths: ['user', 'token']
  }
})

// Helper function to set Authorization header
async function setAuthHeader(authToken: string) {
  // This will be handled by the API plugin
}
```

### Drones Store
```typescript
// stores/drones.ts
export const useDronesStore = defineStore('drones', () => {
  // State
  const drones = ref<Drone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Actions
  const fetchDrones = async (): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<Drone[]>('/api/v1/drones')
      drones.value = data
    } catch (err) {
      error.value = 'Failed to fetch drones'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const createDrone = async (droneData: CreateDroneRequest): Promise<Drone> => {
    try {
      const newDrone = await $fetch<CreateDroneResponse>('/api/v1/drones', {
        method: 'POST',
        body: droneData
      })
      
      // Add to local state
      drones.value.unshift(newDrone)
      
      return newDrone
    } catch (error) {
      throw error
    }
  }
  
  const updateDrone = async (id: string, updateData: UpdateDroneRequest): Promise<void> => {
    try {
      const updatedDrone = await $fetch<CreateDroneResponse>(`/api/v1/drones/${id}`, {
        method: 'PUT',
        body: updateData
      })
      
      // Update local state
      const index = drones.value.findIndex(d => d._id === id)
      if (index !== -1) {
        drones.value[index] = { ...drones.value[index], ...updatedDrone }
      }
    } catch (error) {
      throw error
    }
  }
  
  const deleteDrone = async (id: string): Promise<void> => {
    try {
      await $fetch(`/api/v1/drones/${id}`, { method: 'DELETE' })
      
      // Remove from local state
      drones.value = drones.value.filter(d => d._id !== id)
    } catch (error) {
      throw error
    }
  }
  
  // Getters
  const getDroneById = computed(() => (id: string) => 
    drones.value.find(drone => drone._id === id)
  )
  
  const activeDrones = computed(() =>
    drones.value.filter(drone => drone.currentBatteryCharge > 20)
  )
  
  return {
    // State
    drones: readonly(drones),
    loading: readonly(loading),
    error: readonly(error),
    
    // Actions
    fetchDrones,
    createDrone,
    updateDrone,
    deleteDrone,
    
    // Getters
    getDroneById,
    activeDrones
  }
})
```

---

## MIDDLEWARE

### Auth Middleware
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn, initializeAuth } = useAuthStore()
  
  // Initialize auth on client-side
  if (process.client && !isLoggedIn.value) {
    initializeAuth()
  }
  
  // Check if user is authenticated
  if (!isLoggedIn.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
})
```

### Guest Middleware
```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn } = useAuthStore()
  
  // Redirect authenticated users away from auth pages
  if (isLoggedIn.value) {
    return navigateTo('/')
  }
})
```

---

## PLUGINS

### API Plugin
```typescript
// plugins/api.client.ts
export default defineNuxtPlugin(() => {
  const { token, logout } = useAuthStore()
  
  // Configure global $fetch defaults
  $fetch.create({
    baseURL: '/api/v1',
    
    onRequest({ request, options }) {
      // Add auth token to requests
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    
    onResponseError({ response }) {
      // Handle 401 errors by logging out
      if (response.status === 401) {
        logout()
      }
    }
  })
})
```

### PrimeVue Plugin
```typescript
// plugins/primevue.client.ts
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities'
        }
      }
    }
  })
  
  nuxtApp.vueApp.use(ConfirmationService)
  nuxtApp.vueApp.use(ToastService)
  nuxtApp.vueApp.directive('tooltip', Tooltip)
})
```

---

## NUXT CONFIGURATION

### nuxt.config.ts
```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt'
  ],
  
  css: [
    'primevue/resources/themes/aura-light-blue/theme.css',
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
    '~/assets/styles/main.css'
  ],
  
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700]
    }
  },
  
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  },
  
  ssr: false, // SPA mode for easier development
  
  experimental: {
    payloadExtraction: false
  }
})
```

---

## DEVELOPMENT PHASES

### Phase 1: Authentication & Basic Structure (3-5 days)
1. Настройка проекта Nuxt 3 + PrimeVue
2. Аутентификация с сохранением сессии
3. Базовый layout с навигацией
4. Dashboard со статистикой
5. CRUD страницы для дронов

### Phase 2: Routes & Map Integration (5-7 days)
1. CRUD страницы для маршрутов
2. Интеграция Leaflet карты
3. Загрузка CSV и фотографий
4. Детальная страница маршрута с картой
5. Отображение точек и информации о них

### Phase 3: Polish & Optimization (2-3 days)
1. Responsive design для мобильных устройств
2. Error handling и loading states
3. Performance optimization
4. Accessibility улучшения
5. Testing и bug fixes

---

## ИТОГО

**Общее время разработки:** 10-15 дней для MVP версии  
**Основные технические вызовы:**
- Интеграция карт с большим количеством точек
- Upload и обработка файлов
- Responsive design для карт
- State management между компонентами

**Ключевые особенности:**
- Современный стек с TypeScript
- Аутентификация с сохранением сессии  
- Интерактивная карта как центральная фича
- Продуманный UX для управления дронами и маршрутами
- Возможность расширения для будущих функций

Готов приступить к реализации! С чего начнем?