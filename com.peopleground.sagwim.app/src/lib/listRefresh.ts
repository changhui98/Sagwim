/**
 * 탭 화면은 마운트가 유지되어 작성/생성 후 돌아와도 useEffect가 재실행되지 않는다.
 * 작성/생성 직후 dirty 플래그를 세워두고, 리스트 화면이 포커스될 때 소비하여
 * 사용자가 수동 새로고침 없이 최신 목록을 보도록 한다.
 */

let postsDirty = false
let groupsDirty = false

export function markPostsDirty(): void {
  postsDirty = true
}

export function consumePostsDirty(): boolean {
  const dirty = postsDirty
  postsDirty = false
  return dirty
}

export function markGroupsDirty(): void {
  groupsDirty = true
}

export function consumeGroupsDirty(): boolean {
  const dirty = groupsDirty
  groupsDirty = false
  return dirty
}
