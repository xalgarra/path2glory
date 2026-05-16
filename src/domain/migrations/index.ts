import { USER_DATA_SCHEMA_VERSION } from '../rules/types'
import type { UserDataEnvelope } from '../hero/types'

/**
 * Runs all applicable migrations on user data loaded from IndexedDB or a
 * backup file, bringing it up to USER_DATA_SCHEMA_VERSION.
 *
 * How to add a new migration:
 *  1. Bump USER_DATA_SCHEMA_VERSION in src/domain/rules/types.ts
 *  2. Implement the transformation in a new vN_to_vM.ts file
 *  3. Uncomment (or add) the corresponding block below
 */
export function runMigrations(data: UserDataEnvelope): UserDataEnvelope {
  let result = { ...data }

  // v1 → v2: uncomment when USER_DATA_SCHEMA_VERSION is bumped to 2
  // if (result.userDataSchemaVersion < 2) {
  //   result = v1ToV2(result)
  // }

  return {
    ...result,
    userDataSchemaVersion: USER_DATA_SCHEMA_VERSION,
  }
}
