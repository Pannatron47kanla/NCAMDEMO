// กฎทิศทางของ DDD สำหรับ ESLint flat config
// ใช้: ใน eslint.config.js ให้เพิ่ม  import boundaries from './eslint.boundaries.js'
//      แล้ว export default [ ...ของเดิม, ...boundaries ]

// import ไฟล์ข้างในของ context อื่น (เช่น ../../catalog/domain/book) ห้ามทุกชั้น
const crossContext = {
  group: ['../../*/domain/**', '../../*/application/**', '../../*/infrastructure/**', '../../*/interface/**',
          '../../../*/domain/**', '../../../*/application/**', '../../../*/infrastructure/**', '../../../*/interface/**'],
  message: 'ห้าม import ไฟล์ข้างในของ context อื่น ให้ใช้ modules/<context>/index.ts หรือประกาศใน application/ports.ts',
};

const rule = (patterns) => ({
  'no-restricted-imports': ['error', { patterns: [...patterns, crossContext] }],
});

export default [
  {
    files: ['src/modules/*/domain/**/*.{ts,tsx}'],
    rules: rule([{
      group: ['pg', 'express', 'typeorm', 'prisma', '@prisma/*', 'knex', 'react', 'react-dom',
              '**/application/**', '**/infrastructure/**', '**/interface/**'],
      message: 'domain ห้าม import ชั้นอื่น, ไลบรารี DB/HTTP หรือ React',
    }]),
  },
  {
    files: ['src/modules/*/application/**/*.{ts,tsx}'],
    rules: rule([{
      group: ['pg', 'express', 'typeorm', 'prisma', '@prisma/*', 'knex',
              '**/infrastructure/**', '**/interface/**'],
      message: 'application ห้ามรู้จัก DB, HTTP หรือ infrastructure ให้ประกาศ interface แล้วรับเข้ามาทาง constructor',
    }]),
  },
  {
    files: ['src/modules/*/infrastructure/**/*.{ts,tsx}'],
    rules: rule([{ group: ['express', '**/interface/**'], message: 'infrastructure ห้ามรู้จัก HTTP' }]),
  },
  {
    // app-level views and main.tsx reach a context only through its index.ts
    files: ['src/app/**/*.{ts,tsx}', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{
        group: ['**/modules/*/domain/**', '**/modules/*/application/**', '**/modules/*/infrastructure/**', '**/modules/*/interface/**', '**/modules/*/module'],
        message: 'app ใช้ context อื่นผ่าน modules/<context>/index.ts เท่านั้น',
      }] }],
    },
  },
  {
    files: ['src/modules/*/interface/**/*.{ts,tsx}'],
    rules: rule([{ group: ['pg', 'typeorm', 'prisma', '@prisma/*', 'knex', '**/infrastructure/**'],
                   message: 'interface ห้ามเขียน SQL หรือเรียก infrastructure ตรง ให้เรียกผ่าน use case' }]),
  },
];
