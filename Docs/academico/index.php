<?php
declare(strict_types=1);
// Módulo acadêmico da integração. O usuário da aplicação é obtido da sessão.
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
session_name('educonnect_academico');
ini_set('session.use_strict_mode','1');
session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Lax']);
session_start();
if (isset($_SESSION['ultimo']) && time()-$_SESSION['ultimo']>1800) {
    $_SESSION=[];
    session_regenerate_id(true);
}
$_SESSION['ultimo']=time();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
function h($v): string {return htmlspecialchars((string)$v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function consulta($sql,$params=[]){
    global $db;
    $q=$db->prepare($sql);
    $q->execute($params);
    return $q;
}
function token(){echo '<input type="hidden" name="csrf" value="'.h($_SESSION['csrf']).'">';}
function numero($campo,$inteiro=false){
    $v=trim($_POST[$campo]??'');
    if ($v==='') return null;
    $v=str_replace(',','.',$v);
    if (!preg_match($inteiro?'/^[0-9]{1,8}$/D':'/^(?:10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?)$/D',$v)) {
        throw new DomainException('Confira os campos numéricos.');
    }
    return $v;
}
function voltar(){header('Location: ./',true,303);exit;}
try {
    $user=getenv('EDU_DB_USER');
    if (!$user) throw new RuntimeException('Configuração ausente');
    $db=new PDO(getenv('EDU_DSN')?:'mysql:host=127.0.0.1;dbname=educonnect_integracao;charset=utf8mb4',
        $user,getenv('EDU_DB_PASSWORD')?:'',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);
} catch(Throwable $e) {
    http_response_code(503);
    exit('Conexão indisponível. Confira EDU_DSN, EDU_DB_USER e EDU_DB_PASSWORD no servidor.');
}
$ator=(int)($_SESSION['ator']??0);
$papeis=$ator?consulta('SELECT p.ds_codigo FROM tb_papel p JOIN tb_usuario_papel up ON up.cd_papel=p.cd_papel JOIN tb_usuario_acesso u ON u.cd_usuario=up.cd_usuario WHERE u.ic_ativo AND u.cd_usuario=?',[$ator])->fetchAll(PDO::FETCH_COLUMN):[];
if ($ator && !$papeis) {$_SESSION=[];session_regenerate_id(true);voltar();}
$gestor=(bool)array_intersect(['Coordenação','Administração','Direção'],$papeis);
$secretaria=in_array('Secretaria',$papeis,true);
$professor=in_array('Professor',$papeis,true);
$erro='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    try {
        if (!hash_equals($_SESSION['csrf'],$_POST['csrf']??'')) throw new DomainException('Sessão expirada. Atualize a página.');
        $acao=$_POST['acao']??'';
        if ($acao==='login' && !$ator) {
            $ident=trim($_POST['login']??'');
            $chave=hash('sha256',strtolower($ident).'|'.($_SERVER['REMOTE_ADDR']??''));
            // Contagem no banco para sobreviver à renovação dos cookies do navegador.
            $db->beginTransaction();
            consulta('INSERT INTO tb_limite_login(chave,tentativas,inicio) VALUES(?,0,NOW()) ON DUPLICATE KEY UPDATE chave=chave',[$chave]);
            $lim=consulta('SELECT tentativas, inicio>NOW()-INTERVAL 10 MINUTE AS recente FROM tb_limite_login WHERE chave=? FOR UPDATE',[$chave])->fetch(PDO::FETCH_ASSOC);
            if ($lim['recente'] && $lim['tentativas']>=5) {$db->commit();throw new DomainException('Aguarde dez minutos antes de tentar novamente.');}
            $conta=consulta('SELECT cd_usuario,ds_credencial_hash FROM tb_usuario_acesso WHERE ds_identificador=? AND ic_ativo',[$ident])->fetch(PDO::FETCH_ASSOC);
            if (!$conta || !password_verify($_POST['senha']??'',$conta['ds_credencial_hash'])) {
                consulta('UPDATE tb_limite_login SET tentativas=IF(inicio>NOW()-INTERVAL 10 MINUTE,tentativas+1,1),inicio=IF(inicio>NOW()-INTERVAL 10 MINUTE,inicio,NOW()) WHERE chave=?',[$chave]);
                $db->commit();
                throw new DomainException('Identificador ou senha inválidos.');
            }
            consulta('DELETE FROM tb_limite_login WHERE chave=?',[$chave]);
            consulta('UPDATE tb_usuario_acesso SET dt_ultimo_acesso=NOW() WHERE cd_usuario=?',[$conta['cd_usuario']]);
            $db->commit();
            session_regenerate_id(true);
            $_SESSION=['ator'=>$conta['cd_usuario'],'csrf'=>bin2hex(random_bytes(32)),'ultimo'=>time()];
            voltar();
        }
        if (!$ator) throw new DomainException('Entre para continuar.');
        if ($acao==='sair') {$_SESSION=[];session_regenerate_id(true);voltar();}
        $atrib=numero('atribuicao',true); $periodo=numero('periodo',true);
        if ($acao==='fechar') $q=consulta('CALL sp_fechar_bimestre(?,?,?)',[$atrib,$periodo,$ator]);
        elseif ($acao==='emitir') $q=consulta('CALL sp_gerar_boletins(?,?,?)',[numero('turma',true),$periodo,$ator]);
        elseif (in_array($acao,['Notas','Frequência','Chamada'],true)) {
            $q=consulta('CALL sp_editar_diario(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[$ator,numero('matricula',true),
                $atrib,$periodo,numero('revisao',true),$acao,numero('n1'),numero('n2'),numero('n3'),numero('aulas',true),
                numero('presentes',true),($_POST['dia']??'')?:null,numero('numero',true),($_POST['presenca']??'')?:null,
                trim($_POST['motivo']??'')]);
        } else throw new DomainException('Operação desconhecida.');
        $q->closeCursor();
        $_SESSION['mensagem']='Operação registrada.';
        voltar();
    } catch(DomainException $e){$erro=$e->getMessage();}
      catch(PDOException $e){if ($db->inTransaction()) $db->rollBack();
        $erro=$e->getCode()==='45000'?($e->errorInfo[2]??'Operação recusada.'):'O banco recusou a operação. Confira os valores e recarregue.';
    }
}
function ocultos($r){
    token();
    foreach(['cd_atribuicao'=>'atribuicao','cd_periodo'=>'periodo','cd_turma'=>'turma','cd_matricula'=>'matricula','revisao'=>'revisao'] as $k=>$n)
        echo '<input type="hidden" name="'.$n.'" value="'.h($r[$k]).'">';
}
?><!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EduConnect · Diário e boletins</title><link rel="stylesheet" href="academico.css">
<main><header><strong>EduConnect</strong><h1>Diário e boletins</h1></header>
<?php if ($erro): ?><p role="alert"><?=h($erro)?></p><?php endif ?>
<?php if (isset($_SESSION['mensagem'])): ?><p role="status"><?=h($_SESSION['mensagem'])?></p><?php unset($_SESSION['mensagem']);endif ?>
<?php if (!$ator): ?>
<form method="post"><?php token() ?><label>Identificador <input name="login" autocomplete="username" required></label>
<label>Senha <input type="password" name="senha" autocomplete="current-password" required></label><button name="acao" value="login">Entrar</button></form>
<?php else: ?>
<form method="post"><?php token() ?><span><?=h(implode(', ',$papeis))?></span><button name="acao" value="sair">Sair</button></form>
<h2>Diário por bimestre</h2>
<?php
$linhas=consulta('SELECT d.* FROM vw_diario_integracao d JOIN vw_acesso_diario ac USING(cd_matricula,cd_atribuicao,cd_periodo)
 WHERE ac.cd_usuario=? ORDER BY d.qt_ano_letivo DESC,d.nm_turma,d.qt_numero_bimestre,d.nm_disciplina,d.nm_completo',[$ator]);
$grupo='';
foreach ($linhas as $r):
 $chave=$r['cd_atribuicao'].'-'.$r['cd_periodo'];
 if ($chave!==$grupo): $grupo=$chave;?>
<h3><?=h($r['nm_turma'].' · '.$r['nm_disciplina'].' · '.$r['bimestre'].' de '.$r['qt_ano_letivo'])?></h3>
<?php if (($secretaria||$professor) && !$r['ic_fechado'] || $secretaria && $r['ic_fechado']): ?>
<form method="post"><?php ocultos($r); if (!$r['ic_fechado']): ?><button name="acao" value="fechar">Fechar disciplina no bimestre</button><?php endif;
 if ($secretaria && $r['ic_fechado']): ?><button name="acao" value="emitir">Emitir lote da turma</button><?php endif ?></form><?php endif;endif;?>
<details><summary><?=h($r['nm_completo'].' · Média '.($r['media']??'pendente').' · '.$r['situacao'])?></summary>
<p><?=h('N1 '.($r['n1']??'—').' / N2 '.($r['n2']??'—').' / N3 '.($r['n3']??'—').' · Frequência '.($r['vl_frequencia_pct']??'—').'% · '.$r['situacao_frequencia'].' · '.($r['ic_fechado']?'Fechado':'Aberto'))?></p>
<?php if ($gestor || (!$r['ic_fechado'] && ($professor||$secretaria))): ?>
<form method="post"><?php ocultos($r);foreach(['n1','n2','n3'] as $n): ?><label><?=strtoupper($n)?> <input type="number" step=".01" min="0" max="10" name="<?=$n?>" value="<?=h($r[$n])?>"></label><?php endforeach ?>
<label>Justificativa <input name="motivo" maxlength="500" <?=$r['ic_fechado']?'required':''?>></label><button name="acao" value="Notas">Salvar notas</button></form>
<form method="post"><?php ocultos($r) ?><label>Aulas <input type="number" name="aulas" min="0" value="<?=h($r['qt_aulas_dadas'])?>" required></label>
<label>Presenças <input type="number" name="presentes" min="0" value="<?=h($r['qt_presencas'])?>" required></label>
<label>Justificativa <input name="motivo" maxlength="500" <?=$r['ic_fechado']?'required':''?>></label><button name="acao" value="Frequência">Salvar resumo</button></form>
<form method="post"><?php ocultos($r) ?><label>Data da aula <input type="date" name="dia" required></label>
<label>Aula nº <input type="number" min="1" name="numero" required></label><label>Chamada <select name="presenca"><option>Presente</option><option>Falta</option><option>Justificada</option></select></label>
<label>Justificativa <input name="motivo" maxlength="500" <?=$r['ic_fechado']?'required':''?>></label><button name="acao" value="Chamada">Salvar chamada</button></form>
<?php endif ?></details><?php endforeach;?>
<h2>Boletins publicados</h2>
<div class="rolagem"><table><thead><tr><th>Lote</th><th>Período</th><th>Aluno</th><th>Disciplina</th><th>N1</th><th>N2</th><th>N3</th><th>Média</th><th>Frequência %</th><th>Situação</th></tr></thead><tbody>
<?php foreach(consulta('SELECT b.*,p.nm_periodo,p.qt_ano_letivo FROM vw_boletim_vigente b JOIN tb_periodo_letivo p ON p.cd_periodo=b.cd_periodo
 WHERE EXISTS(SELECT 1 FROM vw_acesso_boletim ac WHERE ac.cd_usuario=? AND ac.cd_lote=b.cd_lote AND ac.cd_matricula=b.cd_matricula)
 ORDER BY p.qt_ano_letivo DESC,b.cd_lote DESC,b.aluno,b.disciplina',[$ator]) as $r):?><tr>
<?php foreach(['cd_lote','nm_periodo','aluno','disciplina','n1','n2','n3','media','frequencia','situacao'] as $k):?><td><?=h($r[$k].($k==='nm_periodo'?' / '.$r['qt_ano_letivo']:''))?></td><?php endforeach ?></tr><?php endforeach ?>
</tbody></table></div><?php endif ?></main></html>
