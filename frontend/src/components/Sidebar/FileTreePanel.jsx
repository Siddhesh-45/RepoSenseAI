import { useState, useMemo } from 'react';
import { getNodeColor } from '../Graph/graphHelpers';

// File extension icons
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    py: '🐍', js: '📜', jsx: '⚛️', ts: '💠', tsx: '⚛️',
    json: '📋', css: '🎨', html: '🌐', md: '📝',
    yaml: '⚙️', yml: '⚙️', toml: '⚙️', cfg: '⚙️',
    txt: '📄', sql: '🗃️', sh: '📟', env: '🔒',
  };
  return icons[ext] || '📄';
}

/**
 * Build a tree structure from flat file paths
 */
function buildTree(nodes) {
  const root = { name: '', children: {}, files: [] };

  for (const node of nodes) {
    const parts = node.id.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      if (!current.children[dirName]) {
        current.children[dirName] = { name: dirName, children: {}, files: [] };
      }
      current = current.children[dirName];
    }

    current.files.push({
      name: parts[parts.length - 1],
      fullPath: node.id,
      type: node.type,
      impact: node.impact,
    });
  }

  return root;
}

function TreeFolder({ name, treeNode, depth, onNodeSelect, selectedNodeId }) {
  const [expanded, setExpanded] = useState(depth < 2);
  
  const dirNames = Object.keys(treeNode.children).sort();
  const files = [...treeNode.files].sort((a, b) => a.name.localeCompare(b.name));
  const hasChildren = dirNames.length > 0 || files.length > 0;

  if (!hasChildren) return null;

  return (
    <div>
      {name && (
        <div
          className="file-tree-item"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            paddingLeft: `${depth * 16 + 8}px`,
            cursor: 'pointer',
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            userSelect: 'none',
          }}
        >
          <span style={{
            fontSize: '0.625rem',
            opacity: 0.5,
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
            width: 12,
          }}>
            ▶
          </span>
          <span style={{ fontSize: '0.875rem', marginRight: 2 }}>
            {expanded ? '📂' : '📁'}
          </span>
          <span className="font-mono" style={{ fontSize: '0.8125rem' }}>
            {name}
          </span>
        </div>
      )}

      {(expanded || !name) && (
        <div>
          {dirNames.map(dir => (
            <TreeFolder
              key={dir}
              name={dir}
              treeNode={treeNode.children[dir]}
              depth={name ? depth + 1 : depth}
              onNodeSelect={onNodeSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
          {files.map(file => (
            <div
              key={file.fullPath}
              className="file-tree-item"
              onClick={() => onNodeSelect({
                id: file.fullPath,
                fullPath: file.fullPath,
                type: file.type,
                impact: file.impact,
                label: file.name,
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                paddingLeft: `${(name ? depth + 1 : depth) * 16 + 20}px`,
                cursor: 'pointer',
                fontSize: '0.8125rem',
                background: selectedNodeId === file.fullPath
                  ? 'rgba(96, 165, 250, 0.1)'
                  : 'transparent',
                borderLeft: selectedNodeId === file.fullPath
                  ? '2px solid var(--accent-start)'
                  : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>
                {getFileIcon(file.name)}
              </span>
              <span className="font-mono" style={{
                fontSize: '0.75rem',
                color: selectedNodeId === file.fullPath
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {file.name}
              </span>
              <span style={{
                marginLeft: 'auto',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: getNodeColor(file.type),
                flexShrink: 0,
                opacity: 0.7,
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreePanel({ nodes, onNodeSelect, selectedNodeId }) {
  const tree = useMemo(() => buildTree(nodes), [nodes]);

  return (
    <div style={{ paddingTop: '0.25rem', paddingBottom: '1rem' }}>
      <TreeFolder
        name=""
        treeNode={tree}
        depth={0}
        onNodeSelect={onNodeSelect}
        selectedNodeId={selectedNodeId}
      />
      {nodes.length === 0 && (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          opacity: 0.5,
        }}>
          No files found
        </div>
      )}
    </div>
  );
}
