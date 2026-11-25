-- Executar como administrador, depois de criar o usuário 'educonnect_web'@'127.0.0.1'.
-- Para atualização sobre a base anterior, substitua educonnect_integracao por educonnect_completo.
GRANT SELECT(cd_usuario,cd_pessoa,ds_identificador,ds_credencial_hash,ic_ativo), UPDATE(dt_ultimo_acesso)
 ON educonnect_integracao.tb_usuario_acesso TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.tb_papel TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.tb_usuario_papel TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.tb_periodo_letivo TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT,INSERT,UPDATE,DELETE ON educonnect_integracao.tb_limite_login TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.vw_acesso_diario TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.vw_diario_integracao TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.vw_acesso_boletim TO 'educonnect_web'@'127.0.0.1';
GRANT SELECT ON educonnect_integracao.vw_boletim_vigente TO 'educonnect_web'@'127.0.0.1';
GRANT EXECUTE ON PROCEDURE educonnect_integracao.sp_editar_diario TO 'educonnect_web'@'127.0.0.1';
GRANT EXECUTE ON PROCEDURE educonnect_integracao.sp_fechar_bimestre TO 'educonnect_web'@'127.0.0.1';
GRANT EXECUTE ON PROCEDURE educonnect_integracao.sp_gerar_boletins TO 'educonnect_web'@'127.0.0.1';
