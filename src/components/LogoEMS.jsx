// src/components/LogoEMS.jsx
// Logo da EMS — imagem do brasão oficial

export function LogoEMS({ tamanho = 52 }) {
  return (
    <img
      src="/images/logo-ems.png"
      alt="Logo EMS"
      style={{
        width: `${tamanho}px`,
        height: `${tamanho}px`,
        objectFit: 'contain',
      }}
    />
  );
}
