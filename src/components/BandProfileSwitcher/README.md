# BandProfileSwitcher

Um componente React com TypeScript que funciona como um indicador do perfil da banda ativa na interface principal. Ao ser clicado, abre um menu dropdown com opções para trocar entre bandas.

## Funcionalidades

- **Exibição Principal**: Mostra o avatar e nome da banda ativa
- **Menu Dropdown**: Lista todas as bandas disponíveis para troca
- **Design Responsivo**: Interface adaptável com hover states

## Props

```typescript
interface MusicalProduct {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface BandProfileSwitcherProps {
  activeMusicalProduct: MusicalProduct;
  musicalProducts: MusicalProduct[];
  onProductChange: (product: MusicalProduct) => void;
  className?: string;
}
```

## Exemplo de Uso

```tsx
import { BandProfileSwitcher } from './components/BandProfileSwitcher';

const mockBands = [
  {
    id: '1',
    name: 'Rock Band Alpha',
    avatarUrl: 'https://example.com/avatar1.jpg'
  },
  {
    id: '2',
    name: 'Jazz Ensemble Beta',
    avatarUrl: 'https://example.com/avatar2.jpg'
  },
  {
    id: '3',
    name: 'Pop Group Gamma'
    // avatarUrl opcional - mostra inicial se não fornecida
  }
];

function Header() {
  const [activeBand, setActiveBand] = useState(mockBands[0]);

  const handleBandChange = (band: MusicalProduct) => {
    setActiveBand(band);
    // Lógica adicional para mudança de banda
  };

  return (
    <header className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <BandProfileSwitcher
        activeMusicalProduct={activeBand}
        musicalProducts={mockBands}
        onProductChange={handleBandChange}
      />
    </header>
  );
}
```

## Estrutura do Componente

```
BandProfileSwitcher/
├── BandProfileSwitcher.tsx    # Componente principal
├── index.ts                   # Exportações
└── README.md                  # Esta documentação
```

## Considerações Técnicas

- **Estado Compartilhável**: O componente é projetado para ter seu estado (banda ativa) gerenciado por um componente pai ou contexto, facilitando compartilhamento com outros componentes
- **Componentes Utilizados**: Usa componentes existentes do projeto (Avatar, Dropdown) para manter consistência
- **Ícones**: Utiliza ícones do Lucide React (ChevronDown, Check)
- **Estilização**: Usa Tailwind CSS para estilização, seguindo o padrão do projeto

## Funcionalidades do Dropdown

1. **Seção de Bandas**: Lista todas as bandas com avatar e nome
2. **Indicador Ativo**: Mostra qual banda está atualmente selecionada
3. **Interação**: Hover states e transições suaves

O componente foi desenvolvido para ser reutilizável e facilmente integrável em diferentes partes da aplicação, mantendo consistência visual e funcional com o restante do sistema.
