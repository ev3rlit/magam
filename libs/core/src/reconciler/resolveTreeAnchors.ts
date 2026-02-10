import { Container, Instance } from './hostConfig';

export function resolveTreeAnchors(container: Container): Container {
    const nodeIds = new Set<string>();

    // Phase 1: collect all node IDs from the tree
    function collectIds(instances: Instance[]) {
        for (const inst of instances) {
            if (inst.props['id']) nodeIds.add(inst.props['id']);
            collectIds(inst.children);
        }
    }
    collectIds(container.children);

    // Phase 2: resolve anchor props to scoped IDs
    function resolveInstances(instances: Instance[]): Instance[] {
        return instances.map(inst => {
            let props = inst.props;

            if (props['anchor'] && props['id']) {
                const anchor = props['anchor'] as string;
                const id = props['id'] as string;
                const dotIdx = id.lastIndexOf('.');
                const scope = dotIdx > -1 ? id.substring(0, dotIdx) : '';

                if (scope && !anchor.includes('.')) {
                    const scopedAnchor = `${scope}.${anchor}`;
                    if (nodeIds.has(scopedAnchor)) {
                        props = { ...props, anchor: scopedAnchor };
                    }
                }
            }

            return {
                ...inst,
                props,
                children: resolveInstances(inst.children),
            };
        });
    }

    return { ...container, children: resolveInstances(container.children) };
}
