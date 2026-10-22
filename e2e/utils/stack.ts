import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Raíz del repositorio, donde vive docker-compose.yml */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Ejecuta SQL en el Postgres de la pila de desarrollo (solo para preparar datos de prueba) */
export const sql = (query: string): string =>
  execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$0"', query],
    { cwd: ROOT, encoding: 'utf8' },
  ).trim();

/** Olvida los envíos previos de alta de un correo, para repetir la suite sin esperar su enfriamiento */
export const resetRegistrationRequests = (email: string): void => {
  if (!/^[\w.+-]+@[\w.-]+$/.test(email)) throw new Error(`Correo inválido: ${email}`);
  sql(`DELETE FROM registration_requests WHERE email = '${email.toLowerCase()}'`);
};
