/**
 * Jest 전역 정리 (테스트 실행 후)
 */

export default async function globalTeardown() {
  // 전역 정리가 필요한 경우 여기에 추가
  console.log('🧪 Jest global teardown completed');
}
