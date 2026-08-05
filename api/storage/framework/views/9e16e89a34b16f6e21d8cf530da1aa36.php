<?php $__env->startSection('content'); ?>
    <!-- GREETING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; padding-bottom: 20px;">
            Verifique seu email
        </td>
    </tr>

    <!-- MESSAGE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 20px;">
            Ola<?php echo e(isset($userName) ? ', ' . $userName : ''); ?>!
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 30px;">
            Obrigado por se cadastrar no <?php echo e(config('app.name')); ?>. Para completar seu cadastro e ativar sua conta, por favor clique no botao abaixo para verificar seu endereco de email.
        </td>
    </tr>

    <!-- BUTTON -->
    <tr>
        <td align="center" style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" bgcolor="#1a1a2e" style="border-radius: 6px;">
                        <a href="<?php echo e($verificationUrl); ?>" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 15px 40px; display: inline-block; border-radius: 6px;">
                            Verificar Email
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- LINK FALLBACK -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6; padding-bottom: 20px;">
            Se o botao acima nao funcionar, copie e cole o link abaixo no seu navegador:
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Courier New', monospace; font-size: 12px; color: #1a1a2e; line-height: 1.6; padding: 15px; background-color: #f8f8f8; border-radius: 4px; word-break: break-all; margin-bottom: 20px;">
            <?php echo e($verificationUrl); ?>

        </td>
    </tr>

    <!-- EXPIRATION WARNING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #999999; line-height: 1.6; padding-top: 20px;">
            <strong>Importante:</strong> Este link expira em <?php echo e($expirationHours ?? 24); ?> horas.
        </td>
    </tr>

    <!-- SECURITY NOTE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #999999; line-height: 1.6; padding-top: 15px;">
            Se voce nao criou uma conta no <?php echo e(config('app.name')); ?>, pode ignorar este email.
        </td>
    </tr>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('emails.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\Users\55319\Desktop\PROJETOS 2026\Flyerx\api\resources\views/emails/verify-email.blade.php ENDPATH**/ ?>