package com.gasautomation.driver;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity do Gas Driver (Capacitor).
 *
 * Esta classe serve como o ponto de entrada principal para a aplicação Android baseada em Capacitor.
 * Ela estende a {@link BridgeActivity}, que é responsável por inicializar a ponte (bridge)
 * entre o código nativo e a camada web (localizada em assets/public), permitindo a execução
 * da aplicação híbrida.
 *
 * @see BridgeActivity
 */
public class MainActivity extends BridgeActivity {

    /**
     * Método chamado quando a atividade é iniciada.
     * Realiza a inicialização básica da atividade.
     *
     * @param savedInstanceState Se a atividade estiver sendo reinicializada após ter sido
     * encerrada anteriormente, este Bundle contém os dados fornecidos mais recentemente.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
